import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import type { Request } from 'express';
import { AdminService } from '../admin.service';

type RequestWithAdmin = Request & {
  admin?: {
    id: string;
    email: string;
    supabaseUserId: string;
  };
};

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly adminService: AdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const token = header.slice('Bearer '.length).trim();

    if (!token) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const secret = new TextEncoder().encode(
      this.configService.getOrThrow<string>('SUPABASE_JWT_SECRET'),
    );

    let supabaseUserId: string;
    let email: string | undefined;

    try {
      const { payload } = await jwtVerify(token, secret);
      supabaseUserId = String(payload.sub ?? '');
      email =
        typeof payload.email === 'string' ? payload.email : undefined;

      if (!supabaseUserId) {
        throw new UnauthorizedException('Unauthorized.');
      }
    } catch {
      throw new UnauthorizedException('Unauthorized.');
    }

    const admin =
      await this.adminService.getBySupabaseUserIdOrThrow(supabaseUserId);

    request.admin = {
      id: admin.id,
      email: admin.email || email || '',
      supabaseUserId: admin.supabaseUserId,
    };

    return true;
  }
}
