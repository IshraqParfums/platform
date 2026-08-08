import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';
import {
  FeatureUnavailableException,
  resolveAdminAuthEnv,
} from '../../../config';
import { AdminService } from '../admin.service';
import type { RequestWithAdmin } from '../types/request-with-admin';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  private jwks: JWTVerifyGetKey | null = null;

  constructor(private readonly adminService: AdminService) {}

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

    let payload: JWTPayload;

    try {
      payload = await this.verifySupabaseAccessToken(token);
    } catch (error) {
      if (error instanceof FeatureUnavailableException) {
        throw error;
      }
      throw new UnauthorizedException('Unauthorized.');
    }

    const supabaseUserId = String(payload.sub ?? '');
    const email = typeof payload.email === 'string' ? payload.email : undefined;

    if (!supabaseUserId) {
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

  /**
   * New Supabase projects sign user access tokens with asymmetric keys (ES256/RS256)
   * discoverable at /.well-known/jwks.json. Legacy projects / API keys still use HS256
   * with the dashboard "JWT Secret".
   */
  private async verifySupabaseAccessToken(token: string): Promise<JWTPayload> {
    const { alg } = decodeProtectedHeader(token);
    const { url: supabaseUrl, jwtSecret } = resolveAdminAuthEnv();
    const issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;

    if (alg === 'HS256') {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret, { issuer });
      return payload;
    }

    const { payload } = await jwtVerify(token, this.getJwks(supabaseUrl), {
      issuer,
    });
    return payload;
  }

  private getJwks(supabaseUrl: string): JWTVerifyGetKey {
    if (!this.jwks) {
      this.jwks = createRemoteJWKSet(
        new URL(
          `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`,
        ),
      );
    }
    return this.jwks;
  }
}
