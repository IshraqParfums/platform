import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import {
  resolvePaymentsEnv,
  type PaymentsEnv,
} from '../../config';

export type RazorpayOrderResult = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

@Injectable()
export class RazorpayClient {
  private memo: { env: PaymentsEnv; client: Razorpay } | null = null;

  /** Public key id for the checkout payload — resolves payments env on demand. */
  get keyId(): string {
    return this.credentials().keyId;
  }

  private credentials(): PaymentsEnv {
    return this.ensure().env;
  }

  private sdk(): Razorpay {
    return this.ensure().client;
  }

  private ensure(): { env: PaymentsEnv; client: Razorpay } {
    if (this.memo) return this.memo;
    const env = resolvePaymentsEnv();
    this.memo = {
      env,
      client: new Razorpay({
        key_id: env.keyId,
        key_secret: env.keySecret,
      }),
    };
    return this.memo;
  }

  async createOrder(input: {
    amountPaise: number;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    // Orders API rejects expire_by (Payment Links only). Expiry is ours locally.
    const order = (await this.sdk().orders.create({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
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
    const order = (await this.sdk().orders.fetch(
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
    const result = (await this.sdk().orders.fetchPayments(
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
    const expected = createHmac('sha256', this.credentials().keySecret)
      .update(payload)
      .digest('hex');

    return this.signaturesMatch(expected, input.razorpaySignature);
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expected = createHmac('sha256', this.credentials().webhookSecret)
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
