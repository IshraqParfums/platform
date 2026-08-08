import {
  BadRequestException,
  ConflictException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BespokeSession, Prisma } from '@prisma/client';
import { BespokeSessionStatus } from '@prisma/client';
import type {
  Accord,
  Answer,
  EngineState,
  Fingerprint,
  MatchInput,
  QuestionNode,
} from '@ishraqparfums/bespoke-engine';
import {
  applyAnswer,
  BESPOKE_ENGINE_VERSION,
  buildWhatIHeard,
  buildWhatIWillBuild,
  describeCandidate,
  DIMENSIONS,
  DIVERGENCE_FRAMING,
  generateNames,
  getNode,
  initialEngineState,
  isAct3Render,
  matchExpertFinal,
  matchExpertShortlist,
  matchFingerprint,
  QUESTION_BUDGET,
  resolveVisibleNodeId,
} from '@ishraqparfums/bespoke-engine';
import type {
  BespokeCandidateCard,
  BespokeFormulaSnapshotV2,
  BespokePublicNode,
  BespokeReferenceProduct,
  BespokeSessionCreateResponse,
  BespokeSessionResultResponse,
  BespokeSessionViewResponse,
} from '@ishraqparfums/shared';
import { BespokeDataService } from './bespoke-data.service';
import { nodeText, toPublicNode } from './bespoke-node-sanitizer';
import {
  BespokeSessionRepository,
  BespokeSessionVersionConflict,
} from './bespoke-session.repository';
import type { AnswerBespokeSessionDto } from './dto/bespoke.dto';
import {
  buildFormulaSnapshot,
  customerCopyTier,
  hashIp,
  hexDigestsMatch,
  newSessionToken,
  sha256Hex,
} from './bespoke.helpers';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_SESSIONS = 30;
/** Concurrent ACTIVE consultations per logged-in customer; oldest is expired. */
const MAX_ACTIVE_SESSIONS_PER_CUSTOMER = 3;
const MAX_FOLLOWUP_TEXT = 500;
const MAX_FREE_TEXT = 1000;

/** What lands in `BespokeSession.resultJson` and, later, on the brew. */
interface StoredSessionResult {
  schemaVersion: 2;
  name: string;
  dedication: string | null;
  brief: string;
  whatIHeard: string;
  sampleFraming: string;
  formula: BespokeFormulaSnapshotV2;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function readState(session: BespokeSession): EngineState {
  return session.stateJson as unknown as EngineState;
}

function readHistory(session: BespokeSession): EngineState[] {
  return Array.isArray(session.historyJson)
    ? (session.historyJson as unknown as EngineState[])
    : [];
}

function readShortlistIds(session: BespokeSession): string[] {
  if (!Array.isArray(session.shortlistJson)) return [];
  return (session.shortlistJson as unknown[]).filter(
    (id): id is string => typeof id === 'string',
  );
}

function readResult(session: BespokeSession): StoredSessionResult | null {
  const value = session.resultJson as unknown;
  if (typeof value !== 'object' || value === null) return null;
  return value as StoredSessionResult;
}

function matchInputOf(state: EngineState): MatchInput {
  return {
    fingerprint: state.fingerprint,
    modifiers: state.modifiers,
    constraints: state.constraints,
    outputChoice: state.outputChoice,
  };
}

function conditionStateOf(state: EngineState) {
  return {
    fingerprint: state.fingerprint,
    fluencyScore: state.fluencyScore,
    fluencyTier: state.fluencyTier,
    visitedNodeIds: state.visitedNodeIds,
    questionsAnswered: state.answers.length,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asFingerprint(value: unknown): Fingerprint | null {
  if (!isRecord(value)) return null;
  const fingerprint = {} as Fingerprint;
  for (const dimension of DIMENSIONS) {
    const raw = value[dimension];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
    fingerprint[dimension] = raw;
  }
  return fingerprint;
}

function materialNames(accord: Accord, position: 'top' | 'heart' | 'base') {
  return [
    ...new Set(
      accord.formula
        .filter((line) => line.note_position === position)
        .map((line) => line.material_name),
    ),
  ];
}

@Injectable()
export class BespokeSessionService {
  constructor(
    private readonly sessions: BespokeSessionRepository,
    private readonly data: BespokeDataService,
  ) {}

  async create(
    customerId: string | null,
    ip: string | null,
  ): Promise<BespokeSessionCreateResponse> {
    const ipHash = hashIp(ip);

    if (ipHash) {
      const recent = await this.sessions.countRecentByIpHash(
        ipHash,
        new Date(Date.now() - RATE_LIMIT_WINDOW_MS),
      );
      if (recent >= RATE_LIMIT_MAX_SESSIONS) {
        throw new HttpException(
          'Too many consultations started from here. Try again in an hour.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (customerId) {
      const active = await this.sessions.countActiveByCustomer(customerId);
      if (active >= MAX_ACTIVE_SESSIONS_PER_CUSTOMER) {
        await this.sessions.expireOldestActiveForCustomer(customerId);
      }
    }

    const token = newSessionToken();
    const state = this.freshState();
    const session = await this.sessions.create({
      tokenHash: sha256Hex(token),
      customerId,
      stateJson: asJson(state),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ipHash,
    });

    const node = getNode(this.data.graph(), state.currentNodeId);
    await this.sessions.recordEvent(session.id, {
      type: 'start',
      nodeId: state.currentNodeId,
      nodeText: nodeText(node),
    });

    return {
      sessionId: session.id,
      sessionToken: token,
      version: session.version,
      node: this.publicNode(state),
      progress: this.progress(state),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async resume(
    id: string,
    token: string | undefined,
    customerId: string | null,
  ): Promise<BespokeSessionViewResponse> {
    const session = await this.loadAuthorized(id, token, customerId);
    return this.buildView(session);
  }

  async answer(
    id: string,
    token: string | undefined,
    customerId: string | null,
    body: AnswerBespokeSessionDto,
  ): Promise<BespokeSessionViewResponse> {
    const session = await this.loadMutable(id, token, customerId);
    const state = readState(session);
    const shortlistIds = readShortlistIds(session);

    if (state.finished) {
      throw this.staleConflict(
        'This consultation is already finished',
        session,
      );
    }
    if (
      body.nodeId !== state.currentNodeId ||
      body.version !== session.version
    ) {
      throw this.staleConflict(
        'This question has already been answered',
        session,
      );
    }

    const graph = this.data.graph();
    const node = getNode(graph, state.currentNodeId);

    if (isAct3Render(node)) {
      throw this.staleConflict(
        'This consultation is already finished',
        session,
      );
    }

    const answer = await this.parseAnswer(node, body.answer, shortlistIds);
    const nextState = applyAnswer(graph, state, answer);
    const nextShortlist = this.shortlistFor(nextState, shortlistIds);

    const updated = await this.sessions.patch(id, session.version, {
      stateJson: asJson(nextState),
      historyJson: asJson([...readHistory(session), state]),
      shortlistJson: nextShortlist.length ? asJson(nextShortlist) : null,
    });

    if (!updated) {
      throw this.staleConflict(
        'This question has already been answered',
        await this.reload(id),
      );
    }

    await this.sessions.recordEvent(id, {
      type: 'answer',
      nodeId: state.currentNodeId,
      nodeText: nodeText(node),
      ...this.answeredOptions(node, nextState),
    });

    return this.buildView(updated);
  }

  async back(
    id: string,
    token: string | undefined,
    customerId: string | null,
  ): Promise<BespokeSessionViewResponse> {
    const session = await this.loadMutable(id, token, customerId);
    const history = readHistory(session);
    const previous = history[history.length - 1];

    if (!previous) {
      throw new BadRequestException('There is nothing to go back to');
    }

    const shortlist = this.shortlistFor(previous, []);
    const updated = await this.sessions.patch(id, session.version, {
      stateJson: asJson(previous),
      historyJson: asJson(history.slice(0, -1)),
      shortlistJson: shortlist.length ? asJson(shortlist) : null,
    });

    if (!updated) {
      throw this.staleConflict(
        'This consultation moved on already',
        await this.reload(id),
      );
    }

    const previousNode = this.safeNode(previous.currentNodeId);
    await this.sessions.recordEvent(id, {
      type: 'back',
      nodeId: previous.currentNodeId,
      nodeText: previousNode ? nodeText(previousNode) : '',
    });

    return this.buildView(updated);
  }

  async restart(
    id: string,
    token: string | undefined,
    customerId: string | null,
  ): Promise<BespokeSessionViewResponse> {
    const session = await this.loadMutable(id, token, customerId);
    const state = this.freshState();

    const updated = await this.sessions.patch(id, session.version, {
      stateJson: asJson(state),
      historyJson: asJson([]),
      shortlistJson: null,
    });

    if (!updated) {
      throw this.staleConflict(
        'This consultation moved on already',
        await this.reload(id),
      );
    }

    await this.sessions.recordEvent(id, {
      type: 'restart',
      nodeId: state.currentNodeId,
      nodeText: nodeText(getNode(this.data.graph(), state.currentNodeId)),
    });

    return this.buildView(updated);
  }

  async complete(
    id: string,
    token: string | undefined,
    customerId: string | null,
  ): Promise<BespokeSessionResultResponse> {
    const session = await this.loadAuthorized(id, token, customerId);
    const existing = readResult(session);

    if (existing) {
      return this.toResultResponse(session, existing);
    }

    this.assertNotExpired(session);

    if (session.status !== BespokeSessionStatus.ACTIVE) {
      throw new ConflictException('This consultation is no longer active');
    }

    const state = readState(session);
    const graph = this.data.graph();
    const finished =
      state.finished || isAct3Render(getNode(graph, state.currentNodeId));

    if (!finished) {
      throw this.staleConflict('The consultation is not finished yet', session);
    }

    const result = this.buildResult(state, readShortlistIds(session));
    const owner = session.customerId ?? customerId;

    if (!owner) {
      const updated = await this.sessions.patch(id, session.version, {
        resultJson: asJson(result),
        status: BespokeSessionStatus.COMPLETED,
      });

      if (!updated) {
        return this.toResultResponseOrThrow(await this.reload(id));
      }

      await this.recordCompletion(id, state);
      return this.toResultResponse(updated, result);
    }

    const minted = await this.mintBrew(session, result, owner, state);
    await this.recordCompletion(id, state);
    return this.toResultResponse(minted.session, result, minted.brewId);
  }

  async result(
    id: string,
    token: string | undefined,
    customerId: string | null,
  ): Promise<BespokeSessionResultResponse> {
    const session = await this.loadAuthorized(id, token, customerId);
    return this.toResultResponseOrThrow(session);
  }

  async claim(
    id: string,
    token: string | undefined,
    customerId: string,
  ): Promise<BespokeSessionResultResponse> {
    const session = await this.loadAuthorized(id, token, customerId);
    const stored = readResult(session);

    if (!stored) {
      if (!session.customerId) {
        const attached = await this.sessions.patch(id, session.version, {
          customerId,
        });
        if (!attached) {
          throw new ConflictException('This consultation moved on already');
        }
      }
      return this.complete(id, token, customerId);
    }

    if (session.bespokePerfumeId) {
      return this.toResultResponse(session, stored);
    }

    const state = readState(session);
    const minted = await this.mintBrew(session, stored, customerId, state);

    await this.sessions.recordEvent(id, {
      type: 'claim',
      nodeId: state.currentNodeId,
      nodeText: '',
    });

    return this.toResultResponse(minted.session, stored, minted.brewId);
  }

  async referenceProducts(): Promise<BespokeReferenceProduct[]> {
    const rows = await this.sessions.referenceProducts();

    return rows.flatMap((row) => {
      const profile = asFingerprint(row.scentProfileJson);
      if (!profile) return [];
      return [{ id: row.id, name: row.name, slug: row.slug, profile }];
    });
  }

  // ---------------------------------------------------------------- internals

  private freshState(): EngineState {
    const graph = this.data.graph();
    const startId = this.data.startNodeId();
    const state = initialEngineState(startId);
    const visibleId = resolveVisibleNodeId(
      graph,
      conditionStateOf(state),
      startId,
    );

    return {
      ...state,
      currentNodeId: visibleId,
      visitedNodeIds: [visibleId],
    };
  }

  private async loadAuthorized(
    id: string,
    token: string | undefined,
    customerId: string | null,
  ): Promise<BespokeSession> {
    const session = await this.sessions.findById(id);
    const notFound = new NotFoundException(
      `Bespoke session with id "${id}" not found`,
    );

    if (!session || !token) {
      throw notFound;
    }
    if (!hexDigestsMatch(sha256Hex(token), session.tokenHash)) {
      throw notFound;
    }
    if (session.customerId && customerId && session.customerId !== customerId) {
      throw notFound;
    }

    return session;
  }

  /** Authorized *and* still answerable — everything that writes state goes through here. */
  private async loadMutable(
    id: string,
    token: string | undefined,
    customerId: string | null,
  ): Promise<BespokeSession> {
    const session = await this.loadAuthorized(id, token, customerId);
    this.assertNotExpired(session);

    if (session.status !== BespokeSessionStatus.ACTIVE) {
      throw new ConflictException('This consultation is no longer active');
    }

    return session;
  }

  private assertNotExpired(session: BespokeSession): void {
    if (session.status === BespokeSessionStatus.EXPIRED) {
      throw new GoneException('This consultation has expired');
    }
    if (
      session.status === BespokeSessionStatus.ACTIVE &&
      session.expiresAt.getTime() <= Date.now()
    ) {
      void this.sessions.markExpired(session.id);
      throw new GoneException('This consultation has expired');
    }
  }

  private async reload(id: string): Promise<BespokeSession> {
    const session = await this.sessions.findById(id);
    if (!session) {
      throw new NotFoundException(`Bespoke session with id "${id}" not found`);
    }
    return session;
  }

  private staleConflict(
    message: string,
    session: BespokeSession,
  ): ConflictException {
    return new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      error: 'BESPOKE_SESSION_STALE',
      message,
      session: this.buildView(session),
    });
  }

  private progress(state: EngineState) {
    return {
      questionsAnswered: state.answers.length,
      questionBudget: QUESTION_BUDGET,
    };
  }

  private safeNode(nodeId: string): QuestionNode | null {
    try {
      return getNode(this.data.graph(), nodeId);
    } catch {
      return null;
    }
  }

  private publicNode(state: EngineState): BespokePublicNode {
    const node = getNode(this.data.graph(), state.currentNodeId);
    const names =
      'type' in node && node.type === 'name_entry'
        ? generateNames(state)
        : undefined;
    return toPublicNode(state.currentNodeId, node, state, names);
  }

  private buildView(session: BespokeSession): BespokeSessionViewResponse {
    const state = readState(session);
    let node: BespokePublicNode | null = null;
    let shortlist: BespokeCandidateCard[] | null = null;
    let finished = state.finished;

    // A graph revision can retire the node a live session is parked on. That
    // is a null node, not a 500 — the client restarts rather than looping on
    // an error.
    const raw = state.finished ? null : this.safeNode(state.currentNodeId);

    if (raw) {
      node = this.publicNode(state);
      if (isAct3Render(raw)) {
        finished = true;
      } else if (raw.type === 'candidate_select') {
        shortlist = this.candidateCards(readShortlistIds(session));
      }
    }

    return {
      sessionId: session.id,
      status: session.status,
      version: session.version,
      node,
      progress: this.progress(state),
      finished,
      shortlist,
      expiresAt: session.expiresAt.toISOString(),
      resultAvailable: session.resultJson != null,
      brewId: session.bespokePerfumeId,
    };
  }

  private candidateCards(ids: string[]): BespokeCandidateCard[] {
    return this.data.accordsByIds(ids).map((accord) => ({
      id: accord.id,
      label: describeCandidate(accord),
      notesByPosition: {
        top: materialNames(accord, 'top'),
        heart: materialNames(accord, 'heart'),
        base: materialNames(accord, 'base'),
      },
    }));
  }

  /**
   * The expert shortlist is computed the moment the preview node becomes
   * current and then frozen, so the three cards a customer chose between are
   * the same three the final match resolves against.
   */
  private shortlistFor(state: EngineState, fallback: string[]): string[] {
    if (state.finished) return fallback;

    const node = this.safeNode(state.currentNodeId);
    if (!node || isAct3Render(node) || node.type !== 'candidate_select') {
      return fallback;
    }

    return matchExpertShortlist(matchInputOf(state)).map((accord) => accord.id);
  }

  private answeredOptions(
    node: QuestionNode,
    nextState: EngineState,
  ): { optionIds: string[]; optionLabels: string[] } {
    const record = nextState.answers[nextState.answers.length - 1];
    if (!record) return { optionIds: [], optionLabels: [] };

    if ('options' in node) {
      return {
        optionIds: record.optionIds,
        optionLabels: record.optionIds.map(
          (id) => node.options.find((o) => o.id === id)?.label ?? id,
        ),
      };
    }

    return {
      optionIds: record.optionIds,
      optionLabels: record.label ? [record.label] : [],
    };
  }

  private async recordCompletion(
    id: string,
    state: EngineState,
  ): Promise<void> {
    await this.sessions.recordEvent(id, {
      type: 'complete',
      nodeId: state.currentNodeId,
      nodeText: '',
    });
  }

  private buildResult(
    state: EngineState,
    shortlistIds: string[],
  ): StoredSessionResult {
    const input = matchInputOf(state);
    const chosenAccordId = state.answers.find(
      (answer) => answer.type === 'candidate_select',
    )?.optionIds[0];

    const { bottle, sample } = chosenAccordId
      ? matchExpertFinal(
          chosenAccordId,
          this.resolveShortlist(shortlistIds, input),
        )
      : matchFingerprint(input);

    const named = state.answers.find((answer) => answer.type === 'name_entry');
    const name =
      named?.perfumeName?.trim() || generateNames(state)[0] || 'Untitled';

    return {
      schemaVersion: 2,
      name,
      dedication: named?.dedication?.trim() || null,
      brief: buildWhatIWillBuild(bottle, customerCopyTier(state)),
      whatIHeard: buildWhatIHeard(state),
      sampleFraming: DIVERGENCE_FRAMING,
      formula: buildFormulaSnapshot(state, bottle, sample),
    };
  }

  private resolveShortlist(ids: string[], input: MatchInput): Accord[] {
    const resolved = this.data.accordsByIds(ids);
    return resolved.length >= 2 ? resolved : matchExpertShortlist(input);
  }

  private async mintBrew(
    session: BespokeSession,
    result: StoredSessionResult,
    customerId: string,
    state: EngineState,
  ): Promise<{ session: BespokeSession; brewId: string }> {
    try {
      const minted = await this.sessions.completeWithBrew(
        session.id,
        session.version,
        {
          resultJson: asJson(result),
          status: BespokeSessionStatus.CLAIMED,
          customerId,
        },
        {
          customerId,
          name: result.name,
          dedication: result.dedication,
          formulaJson: asJson(result.formula),
          stateJson: asJson(state),
          colorThemeJson: asJson(result.formula.colorTheme),
          graphVersion: this.data.graphVersion(),
          engineVersion: BESPOKE_ENGINE_VERSION,
          clientKey: `session:${session.id}`,
        },
      );
      return { session: minted.session, brewId: minted.brew.id };
    } catch (error) {
      // A concurrent complete/claim already minted it — this transaction
      // rolled back, so hand back whatever won the race.
      if (
        error instanceof BespokeSessionVersionConflict ||
        (isRecord(error) && error.code === 'P2002')
      ) {
        const fresh = await this.reload(session.id);
        if (fresh.bespokePerfumeId) {
          return { session: fresh, brewId: fresh.bespokePerfumeId };
        }
      }
      throw error;
    }
  }

  private toResultResponseOrThrow(
    session: BespokeSession,
  ): BespokeSessionResultResponse {
    const stored = readResult(session);
    if (!stored) {
      throw new ConflictException('This consultation has no result yet');
    }
    return this.toResultResponse(session, stored);
  }

  private toResultResponse(
    session: BespokeSession,
    stored: StoredSessionResult | null = readResult(session),
    brewId: string | null = session.bespokePerfumeId,
  ): BespokeSessionResultResponse {
    if (!stored) {
      throw new ConflictException('This consultation has no result yet');
    }

    const theme = stored.formula.colorTheme;

    return {
      sessionId: session.id,
      name: stored.name,
      dedication: stored.dedication,
      colorTheme: theme,
      brief: stored.brief,
      whatIHeard: stored.whatIHeard,
      sampleFraming: stored.sampleFraming || DIVERGENCE_FRAMING,
      familyPrimary: theme.primary,
      familySecondary: theme.secondary,
      brewId,
      claimed: brewId != null,
    };
  }

  // ------------------------------------------------------------ answer parsing

  private async parseAnswer(
    node: QuestionNode,
    raw: Record<string, unknown>,
    shortlistIds: string[],
  ): Promise<Answer> {
    if (isAct3Render(node)) {
      throw new BadRequestException('This step cannot be answered');
    }

    const kind = raw.kind;

    switch (node.type) {
      case 'single_select':
      case 'multi_select': {
        if (kind !== 'select') {
          throw new BadRequestException('This question expects a selection');
        }
        return this.parseSelect(node, raw);
      }

      case 'free_text': {
        if (kind !== 'free_text') {
          throw new BadRequestException('This question expects free text');
        }
        const text = typeof raw.text === 'string' ? raw.text.trim() : '';
        if (!text && !node.optional) {
          throw new BadRequestException('An answer is required here');
        }
        return { kind: 'free_text', text: text.slice(0, MAX_FREE_TEXT) };
      }

      case 'name_entry': {
        if (kind !== 'name') {
          throw new BadRequestException('This question expects a name');
        }
        return this.parseName(node, raw);
      }

      case 'candidate_select': {
        if (kind !== 'candidate') {
          throw new BadRequestException('This question expects a candidate');
        }
        const accordId = typeof raw.accordId === 'string' ? raw.accordId : '';
        if (!shortlistIds.includes(accordId)) {
          throw new BadRequestException('Choose one of the offered candidates');
        }
        return { kind: 'candidate', accordId };
      }

      case 'catalogue_select': {
        if (kind !== 'catalogue_reference') {
          throw new BadRequestException(
            'This question expects a catalogue reference',
          );
        }
        return this.parseCatalogueReference(node.optional === true, raw);
      }

      default:
        throw new BadRequestException('This step cannot be answered');
    }
  }

  private parseSelect(
    node: Extract<QuestionNode, { type: 'single_select' | 'multi_select' }>,
    raw: Record<string, unknown>,
  ): Answer {
    const requested = Array.isArray(raw.optionIds)
      ? raw.optionIds.filter((id): id is string => typeof id === 'string')
      : [];
    const unique = [...new Set(requested)];

    if (unique.length === 0) {
      throw new BadRequestException('Choose at least one option');
    }
    if (node.type === 'single_select' && unique.length > 1) {
      throw new BadRequestException('Choose exactly one option');
    }

    const chosen = unique.map((id) => {
      const option = node.options.find((candidate) => candidate.id === id);
      if (!option) {
        throw new BadRequestException(`Unknown option "${id}"`);
      }
      return option;
    });

    if (chosen.some((option) => option.exclusive) && chosen.length > 1) {
      throw new BadRequestException(
        'That option cannot be combined with others',
      );
    }

    const wantsFollowup = chosen.some((option) => option.followup_free_text);
    const followupText =
      wantsFollowup && typeof raw.followupText === 'string'
        ? raw.followupText.trim().slice(0, MAX_FOLLOWUP_TEXT) || undefined
        : undefined;

    return { kind: 'select', optionIds: unique, followupText };
  }

  private parseName(
    node: Extract<QuestionNode, { type: 'name_entry' }>,
    raw: Record<string, unknown>,
  ): Answer {
    const fields = node.fields;
    const perfumeName =
      typeof raw.perfumeName === 'string' ? raw.perfumeName.trim() : '';
    const dedication =
      typeof raw.dedication === 'string' ? raw.dedication.trim() : '';

    if (
      perfumeName.length < Math.max(fields.perfume_name.min, 1) ||
      perfumeName.length > fields.perfume_name.max
    ) {
      throw new BadRequestException(
        `A name must be between ${Math.max(fields.perfume_name.min, 1)} and ${fields.perfume_name.max} characters`,
      );
    }
    if (dedication.length > fields.dedication.max) {
      throw new BadRequestException(
        `A dedication can be at most ${fields.dedication.max} characters`,
      );
    }
    if (!dedication && fields.dedication.required) {
      throw new BadRequestException('A dedication is required');
    }

    return {
      kind: 'name',
      perfumeName,
      dedication: dedication || undefined,
      nameSource:
        raw.nameSource === 'chose_offered' ? 'chose_offered' : 'customer_typed',
    };
  }

  private async parseCatalogueReference(
    optional: boolean,
    raw: Record<string, unknown>,
  ): Promise<Answer> {
    const perfumeId = typeof raw.perfumeId === 'string' ? raw.perfumeId : null;

    if (!perfumeId) {
      if (!optional) {
        throw new BadRequestException('Pick a perfume from the collection');
      }
      return {
        kind: 'catalogue_reference',
        perfumeId: null,
        perfumeName: null,
        profile: null,
      };
    }

    const product = await this.sessions.findProductProfile(perfumeId);
    const profile = product ? asFingerprint(product.scentProfileJson) : null;

    if (!product || !profile) {
      throw new BadRequestException(
        'That perfume cannot be used as a reference',
      );
    }

    return {
      kind: 'catalogue_reference',
      perfumeId: product.id,
      perfumeName: product.name,
      profile,
    };
  }
}
