import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { requireAuth, requireRole } from '../../middlewares/authGuard.js';

export const adminRouter = Router();

// =============================================================================
// ADMIN PROTECTED ROUTES (Chỉ Quản trị viên ADMIN mới có quyền truy cập)
// =============================================================================

// 1. Thống kê tổng quan Dashboard Admin
adminRouter.get('/stats', requireAuth, requireRole('ADMIN'), adminController.getStats);

// 2. Danh sách hồ sơ cửa hàng / nhà may
adminRouter.get('/stores', requireAuth, requireRole('ADMIN'), adminController.getStores);

// 3. Phê duyệt cửa hàng
adminRouter.post('/stores/:id/approve', requireAuth, requireRole('ADMIN'), adminController.approveStore);

// 4. Từ chối hồ sơ cửa hàng
adminRouter.post('/stores/:id/reject', requireAuth, requireRole('ADMIN'), adminController.rejectStore);

// 5. Quản lý người dùng
adminRouter.get('/users', requireAuth, requireRole('ADMIN'), adminController.getUsers);
adminRouter.patch('/users/:id/status', requireAuth, requireRole('ADMIN'), adminController.updateUserStatus);
adminRouter.patch('/users/:id/role', requireAuth, requireRole('ADMIN'), adminController.updateUserRole);

// 6. Nhật ký kiểm toán hệ thống
adminRouter.get('/audit-logs', requireAuth, requireRole('ADMIN'), adminController.getAuditLogs);

// =============================================================================
// USER SHOP APPLICATION (Bất kỳ người dùng đã đăng nhập nào cũng có thể nộp đơn)
// =============================================================================
adminRouter.post('/stores/apply', requireAuth, adminController.applyShop);
