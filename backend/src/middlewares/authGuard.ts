import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { AppError } from '../utils/responseEnvelope.js';
import { ErrorCode } from '../constants/errorCodes.js';
import { query } from '../config/database.js';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware xác thực Access Token (Bearer Token) và kiểm tra trạng thái LOCKED/BANNED theo thời gian thực.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new AppError(
          401,
          ErrorCode.AUTH_UNAUTHORIZED,
          'Yêu cầu xác thực. Vui lòng gửi kèm Access Token hợp lệ.'
        )
      );
    }

    const token = authHeader.split(' ')[1];
    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(
        new AppError(
          401,
          ErrorCode.AUTH_UNAUTHORIZED,
          'Access Token không hợp lệ hoặc đã hết hạn.'
        )
      );
    }

    // Kiểm tra trạng thái tài khoản trực tiếp trên DB để chặn ngay các Access Token cũ khi đã LOCKED/BANNED
    try {
      const rows = await query<{ status: string }>(
        'SELECT status FROM users WHERE id = $1 LIMIT 1',
        [payload.sub]
      );
      const status = rows[0]?.status;
      if (status === 'LOCKED') {
        return next(
          new AppError(
            403,
            ErrorCode.AUTH_ACCOUNT_LOCKED,
            'Tài khoản đã bị khóa. Vui lòng liên hệ Quản trị viên để mở khóa.'
          )
        );
      }
      if (status === 'BANNED') {
        return next(
          new AppError(
            403,
            ErrorCode.AUTH_ACCOUNT_BANNED,
            'Tài khoản đã bị đình chỉ do vi phạm quy định.'
          )
        );
      }
    } catch {
      // Nếu DB tạm offline (chế độ fallback dev), tiếp tục bằng payload đã xác thực chữ ký
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware xác thực tùy chọn: gắn req.user nếu có Bearer token hợp lệ,
 * nhưng KHÔNG chặn khách vãng lai (Guest) khi không có token.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Ignore expired/invalid optional token — downstream treats actor as guest
    }
  }
  next();
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

/**
 * Middleware bắt buộc gian hàng của SHOP_OWNER phải ở trạng thái APPROVED
 * mới được phép thao tác bán hàng (đăng sản phẩm, xử lý đơn, chỉnh sửa gian hàng).
 */
export async function requireApprovedShop(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Chưa xác thực danh tính.'));
    }
    if (req.user.role === 'ADMIN') {
      return next();
    }
    if (req.user.role !== 'SHOP_OWNER') {
      return next(
        new AppError(
          403,
          ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
          'Chỉ tài khoản Chủ Shop mới có quyền truy cập chức năng này.'
        )
      );
    }

    const rows = await query<{ id: string; status: string; rejection_reason: string | null }>(
      'SELECT id, status, rejection_reason FROM shops WHERE owner_id = $1 LIMIT 1',
      [req.user.sub]
    );
    const shop = rows[0];
    if (!shop) {
      return next(
        new AppError(
          403,
          ErrorCode.AUTH_SHOP_PENDING_APPROVAL,
          'Tài khoản chưa hoàn tất hồ sơ KYC & Thuế gian hàng.'
        )
      );
    }
    if (shop.status === 'PENDING') {
      return next(
        new AppError(
          403,
          ErrorCode.AUTH_SHOP_PENDING_APPROVAL,
          'Hồ sơ gian hàng đang chờ Quản trị viên thẩm định KYC & Thuế.'
        )
      );
    }
    if (shop.status === 'REJECTED') {
      return next(
        new AppError(
          403,
          ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
          shop.rejection_reason
            ? `Hồ sơ gian hàng bị từ chối: ${shop.rejection_reason}`
            : 'Hồ sơ gian hàng bị từ chối. Vui lòng cập nhật lại giấy tờ KYC.'
        )
      );
    }
    if (shop.status === 'SUSPENDED') {
      return next(
        new AppError(
          403,
          ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
          shop.rejection_reason
            ? `Gian hàng đang bị tạm đình chỉ: ${shop.rejection_reason}`
            : 'Gian hàng hiện đang bị tạm đình chỉ hoạt động.'
        )
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

