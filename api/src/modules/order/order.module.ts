import { Module, forwardRef } from '@nestjs/common';
import { AddressModule } from '../address/address.module';
import { AuthModule } from '../auth/auth.module';
import { BespokeModule } from '../bespoke/bespoke.module';
import { CartModule } from '../cart/cart.module';
import { CustomerModule } from '../customer/customer.module';
import { PaymentModule } from '../payment/payment.module';
import { ProductModule } from '../product/product.module';
import { OrderExpiryScheduler } from './order-expiry.scheduler';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

@Module({
  imports: [
    AuthModule,
    AddressModule,
    CartModule,
    CustomerModule,
    ProductModule,
    BespokeModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [OrderController],
  providers: [OrderRepository, OrderService, OrderExpiryScheduler],
  exports: [OrderService],
})
export class OrderModule {}
