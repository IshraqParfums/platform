import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  BespokePerfumeCustomerResponse,
  BespokeReferenceProduct,
  BespokeSessionCreateResponse,
  BespokeSessionResultResponse,
  BespokeSessionViewResponse,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { PaginationQueryDto } from '../../common/dto/pagination.query.dto';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import { OptionalCustomerJwtGuard } from '../auth/guards/optional-customer-jwt.guard';
import type {
  RequestWithCustomer,
  RequestWithOptionalCustomer,
} from '../auth/types/request-with-customer';
import { BespokeSessionService } from './bespoke-session.service';
import { BespokeService } from './bespoke.service';
import { AnswerBespokeSessionDto, RenameBespokeDto } from './dto/bespoke.dto';
import {
  isTrustProxyEnabled,
  resolveClientIp,
} from '../../common/client-ip';

/** Raw session token, minted once at create and never returned again. */
const SESSION_HEADER = 'x-bespoke-session';

function optionalCustomerId(
  request: RequestWithOptionalCustomer,
): string | null {
  return request.user?.customerId ?? null;
}

@Controller('bespoke')
export class BespokeController {
  constructor(
    private readonly bespokeService: BespokeService,
    private readonly sessionService: BespokeSessionService,
  ) {}

  @Post('sessions')
  @UseGuards(OptionalCustomerJwtGuard)
  createSession(
    @Req() request: RequestWithOptionalCustomer,
    @Ip() ip: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ): Promise<BespokeSessionCreateResponse> {
    return this.sessionService.create(
      optionalCustomerId(request),
      resolveClientIp({
        expressIp: ip,
        forwardedFor,
        trustProxy: isTrustProxyEnabled(),
      }),
    );
  }

  @Get('sessions/:id')
  @UseGuards(OptionalCustomerJwtGuard)
  resumeSession(
    @Req() request: RequestWithOptionalCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers(SESSION_HEADER) token?: string,
  ): Promise<BespokeSessionViewResponse> {
    return this.sessionService.resume(id, token, optionalCustomerId(request));
  }

  @Post('sessions/:id/answer')
  @HttpCode(200)
  @UseGuards(OptionalCustomerJwtGuard)
  answer(
    @Req() request: RequestWithOptionalCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AnswerBespokeSessionDto,
    @Headers(SESSION_HEADER) token?: string,
  ): Promise<BespokeSessionViewResponse> {
    return this.sessionService.answer(
      id,
      token,
      optionalCustomerId(request),
      body,
    );
  }

  @Post('sessions/:id/back')
  @HttpCode(200)
  @UseGuards(OptionalCustomerJwtGuard)
  back(
    @Req() request: RequestWithOptionalCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers(SESSION_HEADER) token?: string,
  ): Promise<BespokeSessionViewResponse> {
    return this.sessionService.back(id, token, optionalCustomerId(request));
  }

  @Post('sessions/:id/restart')
  @HttpCode(200)
  @UseGuards(OptionalCustomerJwtGuard)
  restart(
    @Req() request: RequestWithOptionalCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers(SESSION_HEADER) token?: string,
  ): Promise<BespokeSessionViewResponse> {
    return this.sessionService.restart(id, token, optionalCustomerId(request));
  }

  @Post('sessions/:id/complete')
  @HttpCode(200)
  @UseGuards(OptionalCustomerJwtGuard)
  complete(
    @Req() request: RequestWithOptionalCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers(SESSION_HEADER) token?: string,
  ): Promise<BespokeSessionResultResponse> {
    return this.sessionService.complete(id, token, optionalCustomerId(request));
  }

  @Get('sessions/:id/result')
  @UseGuards(OptionalCustomerJwtGuard)
  result(
    @Req() request: RequestWithOptionalCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers(SESSION_HEADER) token?: string,
  ): Promise<BespokeSessionResultResponse> {
    return this.sessionService.result(id, token, optionalCustomerId(request));
  }

  @Post('sessions/:id/claim')
  @HttpCode(200)
  @UseGuards(CustomerJwtGuard)
  claim(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers(SESSION_HEADER) token?: string,
  ): Promise<BespokeSessionResultResponse> {
    return this.sessionService.claim(id, token, request.user.customerId);
  }

  @Get('reference-products')
  referenceProducts(): Promise<BespokeReferenceProduct[]> {
    return this.sessionService.referenceProducts();
  }

  @Get()
  @UseGuards(CustomerJwtGuard)
  list(
    @Req() request: RequestWithCustomer,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<BespokePerfumeCustomerResponse>> {
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
  ): Promise<BespokePerfumeCustomerResponse> {
    return this.bespokeService.getById(request.user.customerId, id);
  }

  @Patch(':id')
  @UseGuards(CustomerJwtGuard)
  rename(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameBespokeDto,
  ): Promise<BespokePerfumeCustomerResponse> {
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
