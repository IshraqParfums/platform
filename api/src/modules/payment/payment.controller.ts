import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { OrderDetail } from '@ishraqparfums/shared';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments/razorpay')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('verify')
  @UseGuards(CustomerJwtGuard)
  verify(@Body() body: VerifyRazorpayPaymentDto): Promise<OrderDetail> {
    return this.paymentService.verifyAndFinalize(body);
  }
}
