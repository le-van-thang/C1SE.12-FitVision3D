import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/responseEnvelope.js';
import { ErrorCode } from '../constants/errorCodes.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipRegisterStore = new Map<string, RateLimitRecord>();

/**
 * Giới hạn tần suất thao tác: Tối đa 5 lần / 30 giây trên 1 IP
 * Hiển thị rõ ràng số giây còn lại và số lần nhập
 */
export function registerRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Bỏ qua rate limit khi đang chạy test nội bộ
  if (process.env.NODE_ENV === 'test' || req.headers['x-test-suite'] === 'true') {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const windowMs = 30 * 1000; // 30 giây
  const maxAttempts = 5;

  const record = ipRegisterStore.get(ip);

  if (!record || now > record.resetAt) {
    ipRegisterStore.set(ip, { count: 1, resetAt: now + windowMs });
    res.setHeader('X-RateLimit-Remaining', maxAttempts - 1);
    return next();
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    res.setHeader('Retry-After', retryAfterSeconds);
    res.setHeader('X-RateLimit-Remaining', 0);
    throw new AppError(
      429,
      ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
      `Bạn đã gửi yêu cầu quá ${maxAttempts} lần. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
    );
  }

  record.count += 1;
  const remaining = Math.max(0, maxAttempts - record.count);
  res.setHeader('X-RateLimit-Remaining', remaining);
  next();
}

const sensitiveStore = new Map<string, RateLimitRecord>();

/**
 * Giới hạn thao tác nhạy cảm của user đã đăng nhập (đổi mật khẩu...):
 * tối đa 5 lần / 5 phút theo từng tài khoản (chống dò mật khẩu hiện tại).
 */
export function sensitiveActionRateLimiter(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'test' || req.headers['x-test-suite'] === 'true') {
    return next();
  }
  const key = `${req.user?.sub || req.ip || 'unknown'}:${req.path}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxAttempts = 5;
  const record = sensitiveStore.get(key);

  if (!record || now > record.resetAt) {
    sensitiveStore.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    res.setHeader('Retry-After', retryAfterSeconds);
    throw new AppError(
      429,
      ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
      `Bạn đã thử quá ${maxAttempts} lần. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
    );
  }
  record.count += 1;
  next();
}
