import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/responseEnvelope.js';
import { ErrorCode } from '../constants/errorCodes.js';

function translateBackendMessage(msg: string, isEn: boolean): string {
  if (!isEn || !msg) return msg;

  if (msg.includes('nhập email') || msg.includes('nhập địa chỉ email') || msg.includes('email.')) {
    return 'Please enter your email address.';
  }
  if (msg.includes('nhập mật khẩu') || msg.includes('Mật khẩu không được để trống')) {
    return 'Please enter your password.';
  }
  if (msg.includes('nhập họ và tên') || msg.includes('Họ và tên')) {
    return 'Please enter your full name.';
  }
  if (msg.includes('không chính xác')) {
    return 'Incorrect email or password.';
  }
  if (msg.includes('chưa được kích hoạt')) {
    return 'Account email has not been activated. Please verify with OTP code.';
  }
  if (msg.includes('đã được sử dụng') || msg.includes('đã được đăng ký')) {
    return 'This email address is already in use by another account.';
  }
  if (msg.includes('tạm thời không được chấp nhận') || msg.includes('tên miền email')) {
    return 'Temporary/disposable email domains are not allowed.';
  }
  if (msg.includes('bị tạm khóa') || msg.includes('bị khóa')) {
    return 'Account is temporarily locked due to multiple failed attempts.';
  }
  if (msg.includes('bị tạm ngưng')) {
    return 'This account has been suspended.';
  }
  if (msg.includes('không chính xác hoặc đã hết hạn') || msg.includes('Mã OTP')) {
    return 'Invalid or expired OTP code.';
  }
  if (msg.includes('không trùng khớp') || msg.includes('không khớp')) {
    return 'Password confirmation does not match.';
  }
  if (msg.includes('Quá nhiều yêu cầu') || msg.includes('Quá số lần') || msg.includes('quá nhiều lần')) {
    return 'Too many attempts. Please try again after 1-2 minutes.';
  }
  if (msg.includes('Dữ liệu gửi lên không hợp lệ')) {
    return 'Invalid input data. Please check your fields.';
  }
  if (msg.includes('lỗi nội bộ') || msg.includes('lỗi hệ thống')) {
    return 'Internal server error. Please try again later.';
  }

  return msg;
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isEn = (req.headers['accept-language'] || '').toLowerCase().startsWith('en');

  // 1. Xử lý lỗi Zod Validation Schema
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => {
      const rawIssue = issue.message;
      return {
        field: issue.path.join('.'),
        issue: translateBackendMessage(rawIssue, isEn),
      };
    });

    const primaryMsg = details[0]?.issue || (isEn ? 'Invalid input data.' : 'Dữ liệu gửi lên không hợp lệ.');

    sendError(
      res,
      400,
      ErrorCode.VALIDATION_FAILED,
      primaryMsg,
      details
    );
    return;
  }

  // 2. Xử lý lỗi có chủ đích (AppError)
  if (err instanceof AppError) {
    const localizedMessage = translateBackendMessage(err.message, isEn);
    sendError(res, err.statusCode, err.code, localizedMessage, err.details);
    return;
  }

  // 3. Xử lý lỗi không lường trước (500)
  console.error('[Unhandled Internal Error]:', err);
  sendError(
    res,
    500,
    ErrorCode.INTERNAL_SERVER_ERROR,
    isEn ? 'Internal server error. Please try again later.' : 'Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau.'
  );
}
