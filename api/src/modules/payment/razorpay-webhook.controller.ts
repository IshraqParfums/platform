import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service';

@Controller('webhooks')
export class RazorpayWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('razorpay')
  @HttpCode(200)
  handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string | undefined,
  ): Promise<{ ok: true }> {
    const rawBody =
      request.rawBody?.toString('utf8') ??
      (typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body ?? {}));

    return this.paymentService.handleWebhook(rawBody, signature);
  }
}
