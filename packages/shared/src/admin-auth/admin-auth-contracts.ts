import type { AdminSummary } from "../admin/admin-summary.js";

export interface AdminLoginBody {
  email: string;
  password: string;
}

export interface AdminRefreshTokenBody {
  refreshToken: string;
}

export interface AdminAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  admin: AdminSummary;
}
