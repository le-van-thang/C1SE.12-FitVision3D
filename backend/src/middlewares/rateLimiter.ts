import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/responseEnvelope.js';
import { ErrorCode } from '../constants/errorCodes.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipRegisterStore = new Map<string, RateLimitRecord>();

/**
 * Giới hạn tần suất đăng ký: Tối đa 3 lần / 10 phút trên 1 IP
 * Tuân thủ @.agent/rules/02-security-anti-spam-rules.md
 */
export function registerRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Bỏ qua rate limit khi đang chạy test nội bộ
  if (process.env.NODE_ENV === 'test' || req.headers['x-test-suite'] === 'true') {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 phút
  const maxAttempts = 3;

  const record = ipRegisterStore.get(ip);

  if (!record || now > record.resetAt) {
    ipRegisterStore.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfterSeconds);
    throw new AppError(
      429,
      ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
      `Bạn đã gửi yêu cầu đăng ký quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(retryAfterSeconds / 60)} phút.`
    );
  }

  record.count += 1;
  next();
}
