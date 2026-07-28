import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderService } from './order.service';

@Injectable()
export class OrderExpiryScheduler {
  private readonly logger = new Logger(OrderExpiryScheduler.name);
  private running = false;

  constructor(private readonly orderService: OrderService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweep(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      await this.orderService.reconcileExpiredPendingOrders();
    } catch (error) {
      this.logger.error(
        'Order expiry sweep failed',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }
}
