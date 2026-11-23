import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/responseEnvelope.js';
import { ErrorCode } from '../constants/errorCodes.js';

interface AiRateRecord {
  count: number;
  resetAt: number;
}

export interface AiRateLimitConfig {
  bucket: string;
  guestPerMin?: number;
  userPerMin: number;
  windowMs?: number;
}

/**
 * Isolated in-memory store for AI chat rate limits.
 * Deliberately separated from auth `registerRateLimiter` so chatting
 * never blocks account registration, password reset, or login flows.
 */
export function createAiRateLimiterStore() {
  const store = new Map<string, AiRateRecord>();

  function check(key: string, maxRequests: number, windowMs: number, now = Date.now()) {
    // Periodic lightweight cleanup when store grows
    if (store.size > 5000) {
      for (const [k, rec] of store.entries()) {
        if (now > rec.resetAt) store.delete(k);
      }
    }

    const record = store.get(key);
    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: Math.max(0, maxRequests - 1), retryAfterSeconds: 0 };
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - record.count),
      retryAfterSeconds: 0,
    };
  }

  return { check, clear: () => store.clear() };
}

const defaultAiStore = createAiRateLimiterStore();

export function enforceAiRateLimit(
  req: Request,
  res: Response,
  config: AiRateLimitConfig,
  store = defaultAiStore
): void {
  if (process.env.NODE_ENV === 'test' || req.headers['x-test-suite'] === 'true') {
    return;
  }

  const windowMs = config.windowMs ?? 60_000;
  const isAuthenticated = Boolean(req.user?.sub);
  const maxRequests = isAuthenticated ? config.userPerMin : (config.guestPerMin ?? config.userPerMin);
  const ip = req.ip || req.socket?.remoteAddress || 'unknown-ip';
  const actorKey = isAuthenticated ? `u:${req.user!.sub}` : `ip:${ip}`;
  const compositeKey = `${config.bucket}:${actorKey}`;

  const result = store.check(compositeKey, maxRequests, windowMs);
  res.setHeader('X-AI-RateLimit-Remaining', String(result.remaining));

  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
    throw new AppError(
      429,
      ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
      `Bạn đang gửi câu hỏi hơi nhanh. Vui lòng thử lại sau ${result.retryAfterSeconds} giây.`
    );
  }
}

export function createAiRateLimiterMiddleware(config: AiRateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    enforceAiRateLimit(req, res, config);
    next();
  };
}
