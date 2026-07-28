export const OTP_SENDER = Symbol('OTP_SENDER');

export interface OtpSender {
  sendOtp(phone: string, code: string): Promise<void>;
}
