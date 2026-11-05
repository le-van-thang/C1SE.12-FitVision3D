import type { Request, Response } from 'express';
import { adminService } from './admin.service.js';
import { sendSuccess } from '../../utils/responseEnvelope.js';

export const adminController = {
  async getStats(req: Request, res: Response) {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  },

  async getStores(req: Request, res: Response) {
    const stores = await adminService.getAllStores();
    sendSuccess(res, stores);
  },

  async approveStore(req: Request, res: Response) {
    const { id } = req.params;
    const adminUserId = req.user?.userId;
    const store = await adminService.approveStore(id, adminUserId);
    sendSuccess(res, store, 'Hồ sơ cửa hàng đã được phê duyệt thành công.');
  },

  async rejectStore(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUserId = req.user?.userId;
    const store = await adminService.rejectStore(id, reason, adminUserId);
    sendSuccess(res, store, 'Hồ sơ cửa hàng đã bị từ chối.');
  },

  async getUsers(req: Request, res: Response) {
    const users = await adminService.getAllUsers();
    sendSuccess(res, users);
  },

  async updateUserStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    const adminUserId = req.user?.userId;
    const user = await adminService.updateUserStatus(id, status, adminUserId);
    sendSuccess(res, user, 'Trạng thái người dùng đã được cập nhật.');
  },

  async updateUserRole(req: Request, res: Response) {
    const { id } = req.params;
    const { role } = req.body;
    const adminUserId = req.user?.userId;
    const user = await adminService.updateUserRole(id, role, adminUserId);
    sendSuccess(res, user, 'Vai trò người dùng đã được cập nhật.');
  },

  async getAuditLogs(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await adminService.getAuditLogs(limit);
    sendSuccess(res, logs);
  },

  async applyShop(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Yêu cầu xác thực.');
    }
    const { shopName, phoneNumber, shopAddress, businessLicenseNo } = req.body;
    const shop = await adminService.applyShop(userId, {
      shopName,
      phoneNumber,
      shopAddress,
      businessLicenseNo,
    });
    sendSuccess(res, shop, 'Hồ sơ đã được gửi thành công và đang chờ xét duyệt.');
  },
};
