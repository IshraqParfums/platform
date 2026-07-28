import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrderModule } from '../order/order.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { RazorpayClient } from './razorpay.client';

@Module({
  imports: [AuthModule, forwardRef(() => OrderModule)],
  controllers: [PaymentController, RazorpayWebhookController],
  providers: [RazorpayClient, PaymentService],
  exports: [PaymentService, RazorpayClient],
})
export class PaymentModule {}
