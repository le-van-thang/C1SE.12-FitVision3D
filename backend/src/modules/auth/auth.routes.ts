import { Router } from 'express';
import { authController } from './auth.controller.js';
import { requireAuth, requireRole } from '../../middlewares/authGuard.js';
import { registerRateLimiter } from '../../middlewares/rateLimiter.js';
import { sendSuccess } from '../../utils/responseEnvelope.js';

export const authRouter = Router();

// =============================================================================
// PUBLIC AUTH ENDPOINTS (Bảo vệ bằng Rate Limiting & Honeypot)
// =============================================================================

// 1. Đăng ký Khách Hàng (User)
authRouter.post('/register', registerRateLimiter, authController.register);

// 2. Đăng ký Chủ Shop (Shop Owner)
authRouter.post('/register-shop', registerRateLimiter, authController.registerShop);

// 3. Kích hoạt Email / OTP (Mục 3.3 Contract)
authRouter.post('/verify-email', authController.verifyEmail);

// 4. Gửi lại mã kích hoạt (Mục 3.4 Contract)
authRouter.post('/resend-verification', registerRateLimiter, authController.resendVerification);

// 5. Đăng nhập
authRouter.post('/login', authController.login);

// 6. Quên & Đặt lại mật khẩu (Forgot / Reset Password)
authRouter.post('/forgot-password', registerRateLimiter, authController.forgotPassword);
authRouter.post('/reset-password', registerRateLimiter, authController.resetPassword);

// 7. Đăng nhập / Đăng ký Google (Google OAuth Social Login)
authRouter.post('/google', authController.googleLogin);

// 4. Cấp mới Access Token (Refresh Token Rotation)
authRouter.post('/refresh-token', authController.refreshToken);

// 5. Đăng xuất
authRouter.post('/logout', authController.logout);

// =============================================================================
// PROTECTED ENDPOINTS (Yêu cầu Access Token)
// =============================================================================

// 6. Lấy thông tin phiên hiện tại
authRouter.get('/me', requireAuth, authController.getMe);

// 7. Endpoint Demo kiểm tra phân quyền ADMIN
authRouter.get('/admin-dashboard', requireAuth, requireRole('ADMIN'), (req, res) => {
  sendSuccess(res, {
    message: 'Chào mừng Quản trị viên! Bạn có toàn quyền truy cập hệ thống.',
    user: req.user,
  });
});

// 8. Endpoint Demo kiểm tra phân quyền SHOP_OWNER
authRouter.get('/shop-studio', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), (req, res) => {
  sendSuccess(res, {
    message: 'Chào mừng Chủ shop! Bạn có quyền quản lý kho đồ và sản phẩm 3D.',
    user: req.user,
  });
});

