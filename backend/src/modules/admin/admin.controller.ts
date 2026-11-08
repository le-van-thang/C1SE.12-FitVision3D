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
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const adminUserId = (req.user?.sub || 'system');
    const store = await adminService.approveStore(id, adminUserId);
    sendSuccess(res, store, 200);
  },

  async rejectStore(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;
    const adminUserId = (req.user?.sub || 'system');
    const store = await adminService.rejectStore(id, reason, adminUserId);
    sendSuccess(res, store, 200);
  },

  async getUsers(req: Request, res: Response) {
    const users = await adminService.getAllUsers();
    sendSuccess(res, users);
  },

  async updateUserStatus(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;
    const adminUserId = (req.user?.sub || 'system');
    const user = await adminService.updateUserStatus(id, status, adminUserId);
    sendSuccess(res, user, 200);
  },

  async updateUserRole(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { role } = req.body;
    const adminUserId = (req.user?.sub || 'system');
    const user = await adminService.updateUserRole(id, role, adminUserId);
    sendSuccess(res, user, 200);
  },

  async getAuditLogs(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await adminService.getAuditLogs(limit);
    sendSuccess(res, logs);
  },

  async applyShop(req: Request, res: Response) {
    const userId = (req.user?.sub || 'system');
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
    sendSuccess(res, shop, 201);
  },
};

