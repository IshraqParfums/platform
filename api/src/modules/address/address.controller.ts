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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AddressResponse } from '@ishraqparfums/shared';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import type { RequestWithCustomer } from '../auth/types/request-with-customer';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('customers/addresses')
@UseGuards(CustomerJwtGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  list(@Req() request: RequestWithCustomer): Promise<AddressResponse[]> {
    return this.addressService.list(request.user.customerId);
  }

  @Post()
  create(
    @Req() request: RequestWithCustomer,
    @Body() body: CreateAddressDto,
  ): Promise<AddressResponse> {
    return this.addressService.create(request.user.customerId, body);
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAddressDto,
  ): Promise<AddressResponse> {
    return this.addressService.update(request.user.customerId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.addressService.remove(request.user.customerId, id);
  }
}
