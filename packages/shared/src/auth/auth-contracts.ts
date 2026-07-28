export interface RequestOtpBody {
  phone: string;
}

export interface VerifyOtpBody {
  phone: string;
  code: string;
}

export interface RequestOtpResponse {
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}

export interface AuthTokenResponse {
  accessToken: string;
  customer: {
    id: string;
    phone: string;
    email: string | null;
    name: string | null;
  };
}
