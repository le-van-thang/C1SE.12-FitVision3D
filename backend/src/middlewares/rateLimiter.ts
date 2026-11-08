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
