import { adminRepository } from './admin.repository.js';
import { AppError } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';

export const adminService = {
  async getDashboardStats() {
    return await adminRepository.getStats();
  },

  async getAllStores() {
    return await adminRepository.getAllShops();
  },

  async approveStore(storeId: string, adminUserId?: string) {
    const shop = await adminRepository.approveShop(storeId);
    if (!shop) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy hồ sơ cửa hàng để duyệt.');
    }

    await adminRepository.logAction({
      userId: adminUserId,
      actionType: 'STORE_APPROVED',
      executionTimeMs: 12,
    });

    return shop;
  },

  async rejectStore(storeId: string, reason: string, adminUserId?: string) {
    if (!reason || reason.trim().length === 0) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Vui lòng cung cấp lý do từ chối hồ sơ.');
    }

    const shop = await adminRepository.rejectShop(storeId, reason.trim());
    if (!shop) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy hồ sơ cửa hàng để từ chối.');
    }

    await adminRepository.logAction({
      userId: adminUserId,
      actionType: 'STORE_REJECTED',
      executionTimeMs: 15,
    });

    return shop;
  },

  async getAllUsers() {
    return await adminRepository.getAllUsers();
  },

  async updateUserStatus(userId: string, status: string, adminUserId?: string) {
    // Bảo vệ Super Admin không bị khóa
    const all = await adminRepository.getAllUsers();
    const target = all.find((u) => u.id === userId);
    if (target?.email === 'levanthang0166@gmail.com' && (status === 'LOCKED' || status === 'BANNED')) {
      throw new AppError(403, ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS, 'Không thể khóa tài khoản Super Administrator.');
    }

    const updated = await adminRepository.updateUserStatus(userId, status);
    if (!updated) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy người dùng.');
    }

    await adminRepository.logAction({
      userId: adminUserId,
      actionType: `USER_STATUS_${status}`,
      executionTimeMs: 8,
    });

    return updated;
  },

  async updateUserRole(userId: string, role: string, adminUserId?: string) {
    // Bảo vệ Super Admin không bị hạ quyền
    const all = await adminRepository.getAllUsers();
    const target = all.find((u) => u.id === userId);
    if (target?.email === 'levanthang0166@gmail.com' && role !== 'ADMIN') {
      throw new AppError(403, ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS, 'Không thể thay đổi quyền Super Administrator.');
    }

    const updated = await adminRepository.updateUserRole(userId, role);
    if (!updated) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy người dùng.');
    }

    await adminRepository.logAction({
      userId: adminUserId,
      actionType: `USER_ROLE_${role}`,
      executionTimeMs: 9,
    });

    return updated;
  },

  async getAuditLogs(limit?: number) {
    return await adminRepository.getAuditLogs(limit || 50);
  },

  async applyShop(ownerId: string, data: {
    shopName: string;
    phoneNumber: string;
    shopAddress: string;
    businessLicenseNo?: string;
  }) {
    const shop = await adminRepository.applyShop(ownerId, data);
    await adminRepository.logAction({
      userId: ownerId,
      actionType: 'STORE_APPLICATION_SUBMITTED',
      executionTimeMs: 14,
    });
    return shop;
  },
};
