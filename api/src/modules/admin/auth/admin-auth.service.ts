import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AdminAuthTokenResponse,
  AdminSummary,
} from '@ishraqparfums/shared';
import type { Session } from '@supabase/supabase-js';
import { AdminService } from '../admin.service';
import { SupabaseAuthClient } from './supabase-auth.client';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly supabaseAuthClient: SupabaseAuthClient,
    private readonly adminService: AdminService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<AdminAuthTokenResponse> {
    const client = this.supabaseAuthClient.create();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      const admin = await this.adminService.getBySupabaseUserIdOrThrow(
        data.user.id,
      );
      return this.toTokenResponse(data.session, admin);
    } catch (err) {
      if (err instanceof ForbiddenException) {
        await this.signOutSession(
          data.session.access_token,
          data.session.refresh_token,
        );
      }
      throw err;
    }
  }

  async refresh(refreshToken: string): Promise<AdminAuthTokenResponse> {
    const client = this.supabaseAuthClient.create();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const admin = await this.adminService.getBySupabaseUserIdOrThrow(
      data.user.id,
    );
    return this.toTokenResponse(data.session, admin);
  }

  logout(accessToken: string, refreshToken: string): Promise<void> {
    return this.signOutSession(accessToken, refreshToken);
  }

  private async signOutSession(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    const client = this.supabaseAuthClient.create();
    const { error: setSessionError } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (setSessionError) {
      this.logger.warn(
        `Failed to set session before sign-out: ${setSessionError.message}`,
      );
      return;
    }

    const { error } = await client.auth.signOut();

    if (error) {
      this.logger.warn(`Failed to sign out admin session: ${error.message}`);
    }
  }

  private toTokenResponse(
    session: Session,
    admin: AdminSummary,
  ): AdminAuthTokenResponse {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      admin,
    };
  }
}
