import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BespokeModule } from '../bespoke/bespoke.module';
import { ProductModule } from '../product/product.module';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

@Module({
  imports: [AuthModule, ProductModule, BespokeModule],
  controllers: [CartController],
  providers: [CartRepository, CartService],
  exports: [CartService],
})
export class CartModule {}
