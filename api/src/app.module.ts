import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AddressModule } from './modules/address/address.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { BespokeModule } from './modules/bespoke/bespoke.module';
import { CartModule } from './modules/cart/cart.module';
import { CustomerModule } from './modules/customer/customer.module';
import { HealthModule } from './modules/health/health.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductModule } from './modules/product/product.module';
import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    ProductModule,
    BespokeModule,
    CartModule,
    CustomerModule,
    AddressModule,
    AuthModule,
    AdminModule,
    OrderModule,
    PaymentModule,
    ReviewModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
