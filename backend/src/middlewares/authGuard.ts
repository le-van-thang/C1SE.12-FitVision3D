import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { AppError } from '../utils/responseEnvelope.js';
import { ErrorCode } from '../constants/errorCodes.js';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware xác thực Access Token (Bearer Token)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(
      401,
      ErrorCode.AUTH_UNAUTHORIZED,
      'Yêu cầu xác thực. Vui lòng gửi kèm Access Token hợp lệ.'
    );
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    throw new AppError(
      401,
      ErrorCode.AUTH_UNAUTHORIZED,
      'Access Token không hợp lệ hoặc đã hết hạn.'
    );
  }
}

/**
 * Middleware phân quyền Role-Based Access Control (RBAC)
 * Tuân thủ @.agent/rules/03-rbac-authorization-rules.md
 */
export function requireRole(...allowedRoles: Array<'ADMIN' | 'SHOP_OWNER' | 'USER'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Chưa xác thực danh tính.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
        'Bạn không có quyền truy cập vào tài nguyên này.'
      );
    }

    next();
  };
}

