import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  BespokePerfumeResponse,
  BespokePreviewResponse,
  MergeBespokeResponse,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { PaginationQueryDto } from '../../common/dto/pagination.query.dto';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import type { RequestWithCustomer } from '../auth/types/request-with-customer';
import {
  BespokePreviewDto,
  MergeBespokeDto,
  RenameBespokeDto,
  SaveBespokeDto,
} from './dto/bespoke.dto';
import { BespokeService } from './bespoke.service';

@Controller('bespoke')
export class BespokeController {
  constructor(private readonly bespokeService: BespokeService) {}

  @Post('preview')
  preview(@Body() body: BespokePreviewDto): BespokePreviewResponse {
    return this.bespokeService.preview(body);
  }

  @Post()
  @UseGuards(CustomerJwtGuard)
  save(
    @Req() request: RequestWithCustomer,
    @Body() body: SaveBespokeDto,
  ): Promise<BespokePerfumeResponse> {
    return this.bespokeService.save(request.user.customerId, body);
  }

  @Post('merge')
  @UseGuards(CustomerJwtGuard)
  merge(
    @Req() request: RequestWithCustomer,
    @Body() body: MergeBespokeDto,
  ): Promise<MergeBespokeResponse> {
    return this.bespokeService.merge(request.user.customerId, body.items);
  }

  @Get()
  @UseGuards(CustomerJwtGuard)
  list(
    @Req() request: RequestWithCustomer,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<BespokePerfumeResponse>> {
    return this.bespokeService.list(
      request.user.customerId,
      query.page,
      query.pageSize,
    );
  }

  @Get(':id')
  @UseGuards(CustomerJwtGuard)
  getById(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BespokePerfumeResponse> {
    return this.bespokeService.getById(request.user.customerId, id);
  }

  @Patch(':id')
  @UseGuards(CustomerJwtGuard)
  rename(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameBespokeDto,
  ): Promise<BespokePerfumeResponse> {
    return this.bespokeService.rename(request.user.customerId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(CustomerJwtGuard)
  async delete(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.bespokeService.delete(request.user.customerId, id);
  }
}
