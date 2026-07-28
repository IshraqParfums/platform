import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';

export type RazorpayOrderResult = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

@Injectable()
export class RazorpayClient {
  private readonly client: Razorpay;
  readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(configService: ConfigService) {
    this.keyId = configService.getOrThrow<string>('RAZORPAY_KEY_ID');
    this.keySecret = configService.getOrThrow<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = configService.getOrThrow<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    );

    this.client = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  async createOrder(input: {
    amountPaise: number;
    receipt: string;
    expireByUnix: number;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    const order = (await this.client.orders.create({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
      // Razorpay SDK typings omit expire_by; runtime API supports it.
      ...({ expire_by: input.expireByUnix } as object),
      notes: input.notes,
    })) as RazorpayOrderResult;

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      status: order.status,
    };
  }

  async fetchOrder(razorpayOrderId: string): Promise<RazorpayOrderResult> {
    const order = (await this.client.orders.fetch(
      razorpayOrderId,
    )) as RazorpayOrderResult;

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      status: order.status,
    };
  }

  async fetchPaymentsForOrder(
    razorpayOrderId: string,
  ): Promise<Array<{ id: string; status: string; amount: number }>> {
    const result = (await this.client.orders.fetchPayments(
      razorpayOrderId,
    )) as {
      items?: Array<{ id: string; status: string; amount: number | string }>;
    };

    return (result.items ?? []).map((item) => ({
      id: item.id,
      status: item.status,
      amount: Number(item.amount),
    }));
  }

  verifyPaymentSignature(input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean {
    const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
    const expected = createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    return this.signaturesMatch(expected, input.razorpaySignature);
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return this.signaturesMatch(expected, signature);
  }

  private signaturesMatch(expected: string, actual: string): boolean {
    const left = Buffer.from(expected);
    const right = Buffer.from(actual);

    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  }
}
