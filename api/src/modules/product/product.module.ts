import { Module } from '@nestjs/common';
import { CollectionRepository } from './collection.repository';
import { CollectionService } from './collection.service';
import { CollectionsController } from './collections.controller';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';
import { ProductsController } from './products.controller';

@Module({
  controllers: [CollectionsController, ProductsController],
  providers: [
    CollectionRepository,
    ProductRepository,
    CollectionService,
    ProductService,
  ],
  exports: [CollectionService, ProductService],
})
export class ProductModule {}
