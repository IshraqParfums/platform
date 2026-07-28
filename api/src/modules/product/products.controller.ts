import { Controller, Get, Param, Query } from '@nestjs/common';
import type { ProductDetail, ProductListItem } from '@ishraqparfums/shared';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { ProductService } from './product.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  list(@Query() query: ListProductsQueryDto): Promise<ProductListItem[]> {
    return this.productService.list(query.collection);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<ProductDetail> {
    return this.productService.getBySlug(slug);
  }
}
