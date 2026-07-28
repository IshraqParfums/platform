import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AdminSummary } from '@ishraqparfums/shared';
import { AdminJwtGuard } from './guards/admin-jwt.guard';
import type { RequestWithAdmin } from './types/request-with-admin';

@Controller('admin')
export class AdminController {
  @Get('me')
  @UseGuards(AdminJwtGuard)
  me(@Req() request: RequestWithAdmin): AdminSummary {
    return request.admin;
  }
}
