import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  AdminLowStockVariant,
  AdminProductDetail,
  AdminProductImage,
  AdminProductListItem,
  AdminProductVariant,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
} from '../media/media.constants';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { AdminListProductsQueryDto } from './dto/admin-list-products.query.dto';
import { AdminLowStockQueryDto } from './dto/admin-low-stock.query.dto';
import { CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/admin-variant.dto';
import { CreateImageDto, UpdateImageDto } from './dto/admin-image.dto';
import { ProductService } from './product.service';

@Controller('admin/products')
@UseGuards(AdminJwtGuard)
export class AdminProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  list(
    @Query() query: AdminListProductsQueryDto,
  ): Promise<PaginatedResponse<AdminProductListItem>> {
    return this.productService.listAdmin(query);
  }

  @Get('low-stock')
  listLowStock(
    @Query() query: AdminLowStockQueryDto,
  ): Promise<AdminLowStockVariant[]> {
    return this.productService.listLowStock(query.threshold);
  }

  @Get(':id/cart-impact')
  async cartImpact(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ cartCount: number }> {
    const cartCount = await this.productService.countCartsHoldingProduct(id);
    return { cartCount };
  }

  /**
   * Create-and-release into an archived collection: park as ARCHIVED + COLLECTION.
   * Not a general archive transition — see ProductService.parkReadyProductInArchivedCollection.
   */
  @Post(':id/park-in-archived-collection')
  parkInArchivedCollection(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminProductDetail> {
    return this.productService.parkReadyProductInArchivedCollection(id);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<AdminProductDetail> {
    return this.productService.getAdminById(id);
  }

  @Post()
  create(@Body() body: CreateProductDto): Promise<AdminProductDetail> {
    return this.productService.createProduct(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductDto,
  ): Promise<AdminProductDetail> {
    return this.productService.updateProduct(id, body);
  }

  @Patch(':productId/variants/unavailable')
  makeAllVariantsUnavailable(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<AdminProductDetail> {
    return this.productService.makeAllVariantsUnavailable(productId);
  }

  @Post(':productId/variants')
  createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: CreateVariantDto,
  ): Promise<AdminProductVariant> {
    return this.productService.createVariant(productId, body);
  }

  @Patch(':productId/variants/:variantId')
  updateVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() body: UpdateVariantDto,
  ): Promise<AdminProductVariant> {
    return this.productService.updateVariant(productId, variantId, body);
  }

  @Patch(':productId/variants/:variantId/stock')
  adjustStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() body: AdjustStockDto,
  ): Promise<AdminProductVariant> {
    return this.productService.adjustStock(productId, variantId, body);
  }

  @Post(':productId/images')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  addImage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: ALLOWED_IMAGE_MIME_TYPES }),
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: CreateImageDto,
  ): Promise<AdminProductImage> {
    return this.productService.addImage(productId, file, body);
  }

  @Patch(':productId/images/:imageId')
  updateImage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() body: UpdateImageDto,
  ): Promise<AdminProductImage> {
    return this.productService.updateImage(productId, imageId, body);
  }

  @Delete(':productId/images/:imageId')
  @HttpCode(204)
  removeImage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<void> {
    return this.productService.removeImage(productId, imageId);
  }
}
