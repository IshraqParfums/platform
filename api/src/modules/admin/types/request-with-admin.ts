import type { AdminSummary } from '@ishraqparfums/shared';
import type { Request } from 'express';

export type RequestWithAdmin = Request & {
  admin: AdminSummary;
};
