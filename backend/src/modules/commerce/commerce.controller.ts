import type { Request, Response, NextFunction } from 'express';
import { commerceRepository } from './commerce.repository.js';
import { paypalService } from './paypal.service.js';
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
      sendSuccess(res, {
        settings,
        vouchers,
        products,
        paypal: paypalService.getPublicConfig(),
      });
    } catch (err) {
      next(err);
    }
  },

  async getPayPalConfig(_req: Request, res: Response) {
    sendSuccess(res, paypalService.getPublicConfig());
  },

  async createPayPalOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập để thanh toán PayPal.');
      }
      if (req.user.role === 'SHOP_OWNER') {
        throw new AppError(
          403,
          ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
          'Tài khoản Chủ Shop không dùng để đặt hàng cá nhân. Vui lòng dùng tài khoản Khách hàng (USER).'
        );
      }
      const b = req.body || {};
      if (!b.recipient?.full_name || !b.recipient?.phone || !b.recipient?.address) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Vui lòng cung cấp đầy đủ thông tin người nhận hàng.');
      }
      const result = await commerceRepository.createPayPalCheckoutGroup({
        customerId: req.user.sub,
        customerName: b.customer_name || b.recipient?.full_name || 'Khách FitVision 3D',
        recipient: b.recipient,
        items: Array.isArray(b.items) ? b.items : [],
        couponCode: b.coupon_code || b.voucherCode ? String(b.coupon_code || b.voucherCode).trim().toUpperCase() : undefined,
        estimatedDelivery: b.estimated_delivery ? String(b.estimated_delivery) : undefined,
        measurementSnapshot: b.measurement_snapshot ?? null,
      });
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  async capturePayPalOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập để xác nhận thanh toán.');
      }
      const paypalOrderId = String(req.body?.paypalOrderId || '').trim();
      if (!paypalOrderId) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Thiếu paypalOrderId để đối soát.');
      }
      const result = await commerceRepository.capturePayPalOrderForActor(paypalOrderId, {
        sub: req.user.sub,
        role: req.user.role,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async cancelPendingPayPalOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập.');
      }
      const paypalOrderId = String(req.body?.paypalOrderId || '').trim();
      if (!paypalOrderId) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Thiếu paypalOrderId.');
      }
      const result = await commerceRepository.cancelPendingPayPalGroup(paypalOrderId, {
        sub: req.user.sub,
        role: req.user.role,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập để xem đơn hàng.');
      }
      const orders = await commerceRepository.listOrdersForActor({
        sub: req.user.sub,
        role: req.user.role,
      });
      sendSuccess(res, orders);
    } catch (err) {
      next(err);
    }
  },

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập để đặt hàng.');
      }
      if (req.user.role === 'SHOP_OWNER') {
        throw new AppError(
          403,
          ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
          'Tài khoản Chủ Shop không dùng để đặt hàng cá nhân. Vui lòng sử dụng tài khoản Khách hàng (USER) để tách bạch thuế & chống tự mua.'
        );
      }
      const body = req.body || {};
      const orderId = body.id || `FV3D-${Math.floor(10000 + Math.random() * 90000)}`;
      const customerId = req.user.sub;

      if (!body.recipient?.full_name || !body.recipient?.phone || !body.recipient?.address) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Vui lòng cung cấp đầy đủ thông tin người nhận hàng.');
      }

      const created = await commerceRepository.createOrder({
        id: orderId,
        customer_id: customerId,
        customer_name: body.customer_name || body.recipient?.full_name || 'Khách FitVision 3D',
        recipient: body.recipient || {},
        items: Array.isArray(body.items) ? body.items : [],
        coupon_code:
          body.coupon_code || body.voucherCode
            ? String(body.coupon_code || body.voucherCode).trim().toUpperCase()
            : undefined,
        subtotal: Number(body.subtotal) || 0,
        shipping_fee: Number(body.shipping_fee) || 0,
        discount_amount: Number(body.discount_amount) || 0,
        total_amount: Number(body.total_amount) || 0,
        payment_method: 'paypal',
        payment_status: 'unpaid',
        status: 'pending',
        store_name: body.store_name || '',
        estimated_delivery: body.estimated_delivery || '',
        measurement_snapshot: body.measurement_snapshot ?? null,
      });
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Chưa xác thực danh tính.');
      }
      if (req.user.role === 'SHOP_OWNER') {
        const shop = await commerceRepository.ensureShopForUser(req.user.sub);
        if (!shop || shop.status !== 'APPROVED') {
          throw new AppError(
            403,
            ErrorCode.AUTH_SHOP_PENDING_APPROVAL,
            'Gian hàng cần được Quản trị viên phê duyệt trước khi xử lý đơn hàng.'
          );
        }
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body || {};
      const valid = ['pending', 'confirmed', 'tailoring', 'shipping', 'completed', 'cancelled'];
      if (!valid.includes(status)) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Trạng thái đơn hàng không hợp lệ.');
      }
      const updated = await commerceRepository.updateOrderStatus(id, status, {
        sub: req.user.sub,
        role: req.user.role,
      });
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
      if (!req.user) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Chưa xác thực danh tính.');
      }
      if (req.user.role === 'USER') {
        throw new AppError(
          403,
          ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
          'Khách hàng không thể tự đánh dấu đã thanh toán. Trạng thái sẽ tự cập nhật qua SePay Webhook hoặc xác nhận từ Shop/Admin.'
        );
      }
      if (req.user.role === 'SHOP_OWNER') {
        const shop = await commerceRepository.ensureShopForUser(req.user.sub);
        if (!shop || shop.status !== 'APPROVED') {
          throw new AppError(
            403,
            ErrorCode.AUTH_SHOP_PENDING_APPROVAL,
            'Gian hàng cần được Quản trị viên phê duyệt trước khi xử lý đơn hàng.'
          );
        }
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await commerceRepository.markOrderPaid(id, {
        sub: req.user.sub,
        role: req.user.role,
      });
      if (!updated) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy đơn hàng.');
      }
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async handlePayPalWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const verified = await paypalService.verifyWebhookSignature(req.headers, req.body);
      if (!verified) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Chữ ký PayPal Webhook không hợp lệ.');
      }
      const result = await commerceRepository.handlePayPalWebhookEvent(req.body);
      sendSuccess(res, { acknowledged: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getShopPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập tài khoản Shop.');
      }
      const data = await commerceRepository.getShopPayoutLedger(userId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async updateShopPayPalAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập tài khoản Shop.');
      }
      const updated = await commerceRepository.updateShopPayPalAccount(
        userId,
        String(req.body?.paypalPayoutEmail || '')
      );
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async getAdminPayouts(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await commerceRepository.getAdminPayoutOverview();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async disburseAdminPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = req.user?.sub || 'system';
      const shopIds = Array.isArray(req.body?.shopIds) ? req.body.shopIds.map(String) : undefined;
      const result = await commerceRepository.disburseShopPayouts(shopIds, adminUserId);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  async syncAdminPayoutBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await commerceRepository.syncAdminPayoutStatus(id);
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

  async getShopDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập tài khoản Shop.');
      }
      const data = await commerceRepository.getShopDashboard(userId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async updateShopProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập tài khoản Shop.');
      }
      const updated = await commerceRepository.updateShopProfile(userId, req.body || {});
      sendSuccess(res, updated);
    } catch (err: any) {
      if (err?.message) {
        return next(new AppError(400, ErrorCode.VALIDATION_FAILED, err.message));
      }
      next(err);
    }
  },

  async suggestProductDescription(req: Request, res: Response, next: NextFunction) {
    try {
      const suggestion = commerceRepository.suggestProductDescription(req.body || {});
      sendSuccess(res, { description: suggestion });
    } catch (err) {
      next(err);
    }
  },

  async createShopProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập tài khoản Shop.');
      }
      const created = await commerceRepository.createShopProduct(userId, req.body || {});
      sendSuccess(res, created, 201);
    } catch (err: any) {
      if (err?.message) {
        return next(new AppError(400, ErrorCode.VALIDATION_FAILED, err.message));
      }
      next(err);
    }
  },

  async updateShopProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      const isAdmin = req.user?.role === 'ADMIN';
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập.');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await commerceRepository.updateShopProduct(userId, isAdmin, id, req.body || {});
      if (!updated) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy sản phẩm thuộc shop của bạn.');
      }
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteShopProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      const isAdmin = req.user?.role === 'ADMIN';
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập.');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await commerceRepository.deleteShopProduct(userId, isAdmin, id);
      if (!deleted) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy sản phẩm thuộc shop của bạn.');
      }
      sendSuccess(res, { deleted: true, id });
    } catch (err) {
      next(err);
    }
  },

  async listPublicStores(_req: Request, res: Response, next: NextFunction) {
    try {
      const stores = await commerceRepository.listPublicStores();
      sendSuccess(res, stores);
    } catch (err) {
      next(err);
    }
  },

  async getPublicStorefront(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const storefront = await commerceRepository.getPublicStorefrontBySlug(slug);
      if (!storefront) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy gian hàng.');
      }
      sendSuccess(res, storefront);
    } catch (err) {
      next(err);
    }
  },

  async listProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reviews = await commerceRepository.listProductReviews(id);
      sendSuccess(res, reviews);
    } catch (err) {
      next(err);
    }
  },

  async createProductReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập để gửi đánh giá.');
      }
      if (req.user?.role === 'SHOP_OWNER') {
        throw new AppError(
          403,
          ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
          'Tài khoản Chủ Shop không được tự gửi đánh giá sản phẩm.'
        );
      }
      const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { rating, comment, userName } = req.body || {};
      const cleanComment = String(comment || '').trim();
      const numRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
      if (cleanComment.length < 3) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Nội dung bình luận phải có ít nhất 3 ký tự.');
      }
      const result = await commerceRepository.createProductReview({
        productId,
        userId,
        userName: String(userName || req.user?.email || 'Khách hàng FitVision').trim(),
        rating: numRating,
        comment: cleanComment,
      });
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  async replyProductReview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Vui lòng đăng nhập tài khoản Shop để phản hồi đánh giá.');
      }
      const reviewId = parseInt(Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId, 10);
      const reply = String(req.body?.reply || '').trim();
      if (!Number.isFinite(reviewId) || reply.length < 2) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Nội dung phản hồi không hợp lệ.');
      }
      const updated = await commerceRepository.replyProductReview(reviewId, reply, {
        sub: req.user.sub,
        role: req.user.role,
      });
      if (!updated) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy đánh giá.');
      }
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },
};
