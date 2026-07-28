export type OtpRateLimitKind = "cooldown" | "window_15m" | "daily";

export interface OtpRateLimitErrorBody {
  statusCode: 429;
  message: string;
  retryAfterSeconds: number;
  limit: OtpRateLimitKind;
}
