import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BespokeSessionRepository } from './bespoke-session.repository';

const ABANDONED_SESSION_DAYS = 30;
const EVENT_RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Consultations that never became a brew are throwaway state, and the quiz
 * event log is only useful while it is recent. Both are swept nightly so the
 * tables stay proportional to live traffic rather than to all-time traffic.
 */
@Injectable()
export class BespokePruneScheduler {
  private readonly logger = new Logger(BespokePruneScheduler.name);
  private running = false;

  constructor(private readonly sessions: BespokeSessionRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async prune(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const now = Date.now();
      const sessions = await this.sessions.pruneAbandonedSessions(
        new Date(now - ABANDONED_SESSION_DAYS * DAY_MS),
      );
      const events = await this.sessions.pruneEvents(
        new Date(now - EVENT_RETENTION_DAYS * DAY_MS),
      );

      if (sessions > 0 || events > 0) {
        this.logger.log(
          `Pruned ${sessions} abandoned bespoke sessions and ${events} quiz events`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Bespoke prune sweep failed',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }
}
