import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Accord, QuestionGraph } from '@ishraqparfums/bespoke-engine';
import {
  assertBespokeDataIntegrity,
  loadAccords,
  loadQuestions,
} from '@ishraqparfums/bespoke-engine';

const FALLBACK_GRAPH_VERSION = '2.0.0';
const FALLBACK_START_NODE_ID = 'I-fluency';

/**
 * Owns the engine's on-disk data: verifies it at boot so a bad deploy fails
 * here rather than on a customer's first question, then hands out the
 * (engine-cached) question graph and accord library.
 */
@Injectable()
export class BespokeDataService implements OnModuleInit {
  private readonly logger = new Logger(BespokeDataService.name);
  private accordsById: Map<string, Accord> | null = null;

  onModuleInit(): void {
    const counts = assertBespokeDataIntegrity();
    this.logger.log(
      `Bespoke engine data verified: ${counts.questionNodes} question nodes, ${counts.accords} accords, ${counts.materials} materials`,
    );
  }

  graph(): QuestionGraph {
    return loadQuestions();
  }

  graphVersion(): string {
    const version = this.graph().meta?.version;
    return typeof version === 'string' && version.trim()
      ? version
      : FALLBACK_GRAPH_VERSION;
  }

  startNodeId(): string {
    const startNode = this.graph().meta?.start_node;
    return typeof startNode === 'string' && startNode.trim()
      ? startNode
      : FALLBACK_START_NODE_ID;
  }

  accordById(id: string): Accord | undefined {
    if (!this.accordsById) {
      this.accordsById = new Map(
        loadAccords().accords.map((accord) => [accord.id, accord]),
      );
    }
    return this.accordsById.get(id);
  }

  /** Resolves ids to accords, dropping any that no longer exist in the library. */
  accordsByIds(ids: string[]): Accord[] {
    return ids
      .map((id) => this.accordById(id))
      .filter((accord): accord is Accord => accord !== undefined);
  }
}
