import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { MediaModule } from '../media/media.module';
import { AdminCollectionsController } from './admin-collections.controller';
import { AdminProductsController } from './admin-products.controller';
import { CollectionArchiveService } from './collection-archive.service';
import { CollectionRepository } from './collection.repository';
import { CollectionService } from './collection.service';
import { CollectionsController } from './collections.controller';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [AdminModule, MediaModule],
  controllers: [
    CollectionsController,
    ProductsController,
    AdminCollectionsController,
    AdminProductsController,
  ],
  providers: [
    CollectionRepository,
    ProductRepository,
    CollectionArchiveService,
    CollectionService,
    ProductService,
  ],
  exports: [CollectionService, ProductService],
})
export class ProductModule {}
