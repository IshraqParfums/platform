import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AdminSummary } from '@ishraqparfums/shared';
import type { Request } from 'express';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

type RequestWithAdmin = Request & {
  admin: AdminSummary;
};

@Controller('admin')
export class AdminController {
  @Get('me')
  @UseGuards(AdminJwtGuard)
  me(@Req() request: RequestWithAdmin): AdminSummary {
    return request.admin;
  }
}
