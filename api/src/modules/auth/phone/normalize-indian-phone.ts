import {
  BadRequestException,
} from '@nestjs/common';

const E164_IN_MOBILE = /^\+91[6-9]\d{9}$/;

/**
 * Normalize Indian mobile numbers to E.164 (+91XXXXXXXXXX).
 */
export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  let national: string;

  if (digits.length === 12 && digits.startsWith('91')) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  } else {
    throw new BadRequestException(
      'Invalid phone number. Use +91 followed by 10 digits.',
    );
  }

  const e164 = `+91${national}`;

  if (!E164_IN_MOBILE.test(e164)) {
    throw new BadRequestException(
      'Invalid phone number. Use +91 followed by 10 digits.',
    );
  }

  return e164;
}
