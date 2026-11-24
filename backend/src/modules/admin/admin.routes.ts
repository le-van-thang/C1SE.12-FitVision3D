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

// 4. Từ chối / Tạm đình chỉ hồ sơ cửa hàng
adminRouter.post('/stores/:id/reject', requireAuth, requireRole('ADMIN'), adminController.rejectStore);
adminRouter.post('/stores/:id/suspend', requireAuth, requireRole('ADMIN'), adminController.suspendStore);

// 4b. Cấp / thu hồi huy hiệu FitVision Mall chính hãng
adminRouter.patch('/stores/:id/mall', requireAuth, requireRole('ADMIN'), adminController.toggleStoreMall);

// 4c. Tra cứu & Kiểm tra Mã số thuế (Casso Open Platform + Mod-11)
adminRouter.get('/tax-lookup/:taxCode', adminController.lookupTaxCode);

// 5. Quản lý người dùng
adminRouter.get('/users', requireAuth, requireRole('ADMIN'), adminController.getUsers);
adminRouter.patch('/users/:id/status', requireAuth, requireRole('ADMIN'), adminController.updateUserStatus);
adminRouter.patch('/users/:id/role', requireAuth, requireRole('ADMIN'), adminController.updateUserRole);

// 6. Nhật ký kiểm toán hệ thống
adminRouter.get('/audit-logs', requireAuth, requireRole('ADMIN'), adminController.getAuditLogs);

// =============================================================================
// SHOP KYC / TAX STATUS & RESUBMISSION (Tài khoản SHOP_OWNER xem trạng thái & nộp lại hồ sơ)
// =============================================================================
adminRouter.get('/stores/my-shop', requireAuth, adminController.getMyShop);
adminRouter.post('/stores/apply', requireAuth, adminController.applyShop);
adminRouter.put('/stores/my-shop/resubmit', requireAuth, adminController.applyShop);

