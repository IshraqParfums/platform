import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { OrderDetail } from '@ishraqparfums/shared';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import type { RequestWithCustomer } from '../auth/types/request-with-customer';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments/razorpay')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('verify')
  @UseGuards(CustomerJwtGuard)
  verify(
    @Body() body: VerifyRazorpayPaymentDto,
    @Req() request: RequestWithCustomer,
  ): Promise<OrderDetail> {
    return this.paymentService.verifyAndFinalize(body, request.user.customerId);
  }
}
