import type { Response } from 'express';
import type { ErrorCodeType } from '../constants/errorCodes.js';

/**
 * Standard Envelope Response Interface
 * Chuẩn hóa đối chiếu với @docs/auth/02_API_CONTRACT.md
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    code: ErrorCodeType | string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  } | null;
  timestamp: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType;
  public readonly details?: Array<{ field: string; issue: string }>;

  constructor(
    statusCode: number,
    code: ErrorCodeType,
    message: string,
    details?: Array<{ field: string; issue: string }>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const envelope: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(envelope);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCodeType | string,
  message: string,
  details?: Array<{ field: string; issue: string }>
): Response {
  const envelope: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(envelope);
}

