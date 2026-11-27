import type { NextFunction, Request, Response } from 'express';
import { adminService } from './admin.service.js';
import { sendSuccess } from '../../utils/responseEnvelope.js';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

/**
 * Wraps Express 4 async route handlers so rejected promises and synchronous errors
 * forward to Express errorHandler instead of crashing the Node process.
 */
const withAsync =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const readSingleParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const adminController = {
  getStats: withAsync(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  }),

  getStores: withAsync(async (_req: Request, res: Response) => {
    const stores = await adminService.getAllStores();
    sendSuccess(res, stores);
  }),

  approveStore: withAsync(async (req: Request, res: Response) => {
    const id = readSingleParam(req.params.id);
    const adminUserId = req.user?.sub || 'system';
    const store = await adminService.approveStore(id, adminUserId);
    sendSuccess(res, store, 200);
  }),

  rejectStore: withAsync(async (req: Request, res: Response) => {
    const id = readSingleParam(req.params.id);
    const { reason } = req.body || {};
    const adminUserId = req.user?.sub || 'system';
    const store = await adminService.rejectStore(id, reason, adminUserId);
    sendSuccess(res, store, 200);
  }),

  suspendStore: withAsync(async (req: Request, res: Response) => {
    const id = readSingleParam(req.params.id);
    const { reason } = req.body || {};
    const adminUserId = req.user?.sub || 'system';
    const store = await adminService.suspendStore(id, String(reason || ''), adminUserId);
    sendSuccess(res, store, 200);
  }),

  toggleStoreMall: withAsync(async (req: Request, res: Response) => {
    const id = readSingleParam(req.params.id);
    const isMall = Boolean(req.body?.isMall);
    const adminUserId = req.user?.sub || 'system';
    const store = await adminService.toggleShopMall(id, isMall, adminUserId);
    sendSuccess(res, store, 200);
  }),

  getUsers: withAsync(async (_req: Request, res: Response) => {
    const users = await adminService.getAllUsers();
    sendSuccess(res, users);
  }),

  updateUserStatus: withAsync(async (req: Request, res: Response) => {
    const id = readSingleParam(req.params.id);
    const { status } = req.body || {};
    const adminUserId = req.user?.sub || 'system';
    const user = await adminService.updateUserStatus(id, status, adminUserId);
    sendSuccess(res, user, 200);
  }),

  updateUserRole: withAsync(async (req: Request, res: Response) => {
    const id = readSingleParam(req.params.id);
    const { role } = req.body || {};
    const adminUserId = req.user?.sub || 'system';
    const user = await adminService.updateUserRole(id, role, adminUserId);
    sendSuccess(res, user, 200);
  }),

  provisionShopForUser: withAsync(async (req: Request, res: Response) => {
    const id = readSingleParam(req.params.id);
    const adminUserId = req.user?.sub || 'system';
    const result = await adminService.provisionShopForUser(id, req.body || {}, adminUserId);
    sendSuccess(res, result, 201);
  }),

  getAuditLogs: withAsync(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await adminService.getAuditLogs(limit);
    sendSuccess(res, logs);
  }),

  getMyShop: withAsync(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('Yêu cầu xác thực.');
    }
    const shop = await adminService.getMyShop(userId);
    sendSuccess(res, shop, 200);
  }),

  applyShop: withAsync(async (req: Request, res: Response) => {
    const userId = req.user?.sub || 'system';
    const shop = await adminService.applyShop(userId, req.body || {});
    sendSuccess(res, shop, 200);
  }),
};

