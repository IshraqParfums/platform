import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductModule } from '../product/product.module';
import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './wishlist.repository';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [AuthModule, ProductModule],
  controllers: [WishlistController],
  providers: [WishlistRepository, WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
