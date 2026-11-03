import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/responseEnvelope.js';
import { ErrorCode } from '../constants/errorCodes.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 1. Xử lý lỗi Zod Validation Schema
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      issue: issue.message,
    }));

    sendError(
      res,
      400,
      ErrorCode.VALIDATION_FAILED,
      details[0]?.issue || 'Dữ liệu gửi lên không hợp lệ.',
      details
    );
    return;
  }

  // 2. Xử lý lỗi có chủ đích (AppError)
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // 3. Xử lý lỗi không lường trước (500)
  console.error('[Unhandled Internal Error]:', err);
  sendError(
    res,
    500,
    ErrorCode.INTERNAL_SERVER_ERROR,
    'Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau.'
  );
}

