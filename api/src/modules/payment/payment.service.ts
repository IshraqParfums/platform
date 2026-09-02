import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import type { OrderDetail } from '@ishraqparfums/shared';
import { OrderService } from '../order/order.service';
import { RazorpayClient } from './razorpay.client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly razorpayClient: RazorpayClient,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
  ) {}

  get keyId(): string {
    return this.razorpayClient.keyId;
  }

  createRazorpayOrder(input: {
    amountPaise: number;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    return this.razorpayClient.createOrder(input);
  }

  async verifyAndFinalize(
    input: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
    customerId: string,
  ): Promise<OrderDetail> {
    const valid = this.razorpayClient.verifyPaymentSignature(input);

    if (!valid) {
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    return this.orderService.finalizePaidOrder(
      {
        razorpayOrderId: input.razorpayOrderId,
        razorpayPaymentId: input.razorpayPaymentId,
        rawPayload: input,
      },
      customerId,
    );
  }

  async handleWebhook(
    rawBody: string,
    signature: string | undefined,
  ): Promise<{ ok: true }> {
    if (!signature) {
      throw new BadRequestException('Missing Razorpay signature');
    }

    const valid = this.razorpayClient.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!valid) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
          };
        };
      };
    };

    const payment = payload.payload?.payment?.entity;

    if (
      payload.event === 'payment.captured' &&
      payment?.id &&
      payment.order_id &&
      payment.status === 'captured'
    ) {
      await this.orderService.finalizePaidOrder({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        rawPayload: payload,
      });
    }

    return { ok: true };
  }

  async findCapturedPaymentId(razorpayOrderId: string): Promise<string | null> {
    const payments =
      await this.razorpayClient.fetchPaymentsForOrder(razorpayOrderId);

    const captured = payments.find(
      (payment) =>
        payment.status === 'captured' || payment.status === 'authorized',
    );

    return captured?.id ?? null;
  }

  async isOrderPaidOnRazorpay(razorpayOrderId: string): Promise<boolean> {
    const order = await this.razorpayClient.fetchOrder(razorpayOrderId);
    return order.status === 'paid';
  }
}
