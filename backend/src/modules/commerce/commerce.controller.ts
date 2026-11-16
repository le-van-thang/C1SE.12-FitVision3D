import type { Request, Response, NextFunction } from 'express';
import { commerceRepository } from './commerce.repository.js';
import { AppError, sendSuccess } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';

export const commerceController = {
  async getBootstrap(req: Request, res: Response, next: NextFunction) {
    try {
      const includeHidden = req.query.includeHidden === '1';
      const [settings, vouchers, products] = await Promise.all([
        commerceRepository.getSettings(),
        commerceRepository.listVouchers(),
        commerceRepository.listProducts(includeHidden),
      ]);
      sendSuccess(res, { settings, vouchers, products });
    } catch (err) {
      next(err);
    }
  },

  async getOrders(_req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await commerceRepository.listOrders();
      sendSuccess(res, orders);
    } catch (err) {
      next(err);
    }
  },

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body || {};
      const orderId = body.id || `FV3D-${Math.floor(10000 + Math.random() * 90000)}`;
      const customerId = req.user?.sub || body.customer_id || 'guest';

      const created = await commerceRepository.createOrder({
        id: orderId,
        customer_id: customerId,
        customer_name: body.customer_name || body.recipient?.full_name || 'Khách FitVision 3D',
        recipient: body.recipient || {},
        items: Array.isArray(body.items) ? body.items : [],
        subtotal: Number(body.subtotal) || 0,
        shipping_fee: Number(body.shipping_fee) || 0,
        discount_amount: Number(body.discount_amount) || 0,
        total_amount: Number(body.total_amount) || 0,
        payment_method: body.payment_method || 'cod',
        payment_status: body.payment_status || 'unpaid',
        status: body.status || 'pending',
        store_name: body.store_name || 'FitVision Atelier',
        estimated_delivery: body.estimated_delivery || '',
      });
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body || {};
      const valid = ['pending', 'confirmed', 'tailoring', 'shipping', 'completed', 'cancelled'];
      if (!valid.includes(status)) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Trạng thái đơn hàng không hợp lệ.');
      }
      const updated = await commerceRepository.updateOrderStatus(id, status);
      if (!updated) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy đơn hàng.');
      }
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async markOrderPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await commerceRepository.markOrderPaid(id);
      if (!updated) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy đơn hàng.');
      }
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async saveSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const b = req.body || {};
      const saved = await commerceRepository.saveSettings({
        marqueeEnabled: Boolean(b.marqueeEnabled),
        marqueeItemsVi: Array.isArray(b.marqueeItemsVi) ? b.marqueeItemsVi : [],
        marqueeItemsEn: Array.isArray(b.marqueeItemsEn) ? b.marqueeItemsEn : undefined,
        heroBadgeVi: String(b.heroBadgeVi || ''),
        heroTitleVi: String(b.heroTitleVi || ''),
        heroHighlightVi: String(b.heroHighlightVi || ''),
      });
      sendSuccess(res, saved);
    } catch (err) {
      next(err);
    }
  },

  async createVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const b = req.body || {};
      if (!b.code || Number(b.discountValue) <= 0) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Mã voucher và giá trị giảm không hợp lệ.');
      }
      const created = await commerceRepository.createVoucher({
        code: String(b.code),
        discountType: b.discountType === 'percent' ? 'percent' : 'fixed',
        discountValue: Number(b.discountValue),
        titleVi: String(b.titleVi || b.code),
        titleEn: String(b.titleEn || b.titleVi || b.code),
        subVi: String(b.subVi || ''),
        subEn: String(b.subEn || ''),
        active: b.active !== false,
        showOnStorefront: b.showOnStorefront !== false,
      });
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const b = req.body || {};
      const updated = await commerceRepository.updateVoucher(code, {
        is_active: typeof b.active === 'boolean' ? b.active : undefined,
        show_on_storefront: typeof b.showOnStorefront === 'boolean' ? b.showOnStorefront : undefined,
      });
      if (!updated) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy voucher.');
      }
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      await commerceRepository.deleteVoucher(code);
      sendSuccess(res, { deleted: true, code: code.toUpperCase() });
    } catch (err) {
      next(err);
    }
  },

  async moderateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const b = req.body || {};
      const updated = await commerceRepository.moderateProduct(id, {
        is_hidden: typeof b.isHidden === 'boolean' ? b.isHidden : undefined,
        sale_price: b.salePrice !== undefined ? Number(b.salePrice) : undefined,
      });
      if (!updated) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy sản phẩm.');
      }
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async getMembership(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập để xem ví hội viên.');
      }
      const wallet = await commerceRepository.getMembershipWallet(userId);
      sendSuccess(res, wallet);
    } catch (err) {
      next(err);
    }
  },

  async checkInMembership(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập để điểm danh hội viên.');
      }
      const result = await commerceRepository.dailyCheckIn(userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async redeemMembershipVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập để đổi mã hội viên.');
      }
      const { code } = req.body || {};
      if (!code) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Thiếu mã voucher cần đổi.');
      }
      const result = await commerceRepository.redeemMembershipVoucher(userId, String(code));
      sendSuccess(res, result);
    } catch (err: any) {
      if (err?.message?.includes('FitPoints') || err?.message?.includes('Mã ưu đãi')) {
        return next(new AppError(400, ErrorCode.VALIDATION_FAILED, err.message));
      }
      next(err);
    }
  },
};
