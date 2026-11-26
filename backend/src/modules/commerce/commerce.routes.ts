import { Router } from 'express';
import { commerceController } from './commerce.controller.js';
import { requireApprovedShop, requireAuth, requireRole } from '../../middlewares/authGuard.js';
import { registerRateLimiter } from '../../middlewares/rateLimiter.js';
import { verifyAccessToken } from '../../utils/jwt.js';

export const commerceRouter = Router();

// Attach req.user when a valid Bearer token is present, without blocking anonymous storefront visitors
function optionalAuth(req: any, _res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(authHeader.split(' ')[1]);
    } catch {
      // ignore invalid optional token
    }
  }
  next();
}

// Public Storefront Bootstrap & Brand Storefronts (Settings + Vouchers + Pre-seeded Products + Shop Ratings)
commerceRouter.get('/bootstrap', commerceController.getBootstrap);
commerceRouter.get('/stores', commerceController.listPublicStores);
commerceRouter.get('/stores/:slug', commerceController.getPublicStorefront);

// Orders (Strict Authenticated Isolation + Stock Control + Bespoke Snapshot)
commerceRouter.get('/orders', requireAuth, commerceController.getOrders);
commerceRouter.post('/orders', requireAuth, commerceController.createOrder);
commerceRouter.patch(
  '/orders/:id/status',
  requireAuth,
  commerceController.updateOrderStatus
);
commerceRouter.patch('/orders/:id/pay', requireAuth, commerceController.markOrderPaid);
commerceRouter.post('/payments/sepay-webhook', commerceController.handleSePayWebhook);

// Real PostgreSQL Membership Endpoints (Authenticated user)
commerceRouter.get('/membership', requireAuth, commerceController.getMembership);
commerceRouter.post('/membership/check-in', requireAuth, commerceController.checkInMembership);
commerceRouter.post('/membership/redeem', requireAuth, commerceController.redeemMembershipVoucher);

// Admin CMS & Catalog Persistence Endpoints
commerceRouter.put('/admin/settings', requireAuth, requireRole('ADMIN'), commerceController.saveSettings);
commerceRouter.post('/admin/vouchers', requireAuth, requireRole('ADMIN'), commerceController.createVoucher);
commerceRouter.patch('/admin/vouchers/:code', requireAuth, requireRole('ADMIN'), commerceController.updateVoucher);
commerceRouter.delete('/admin/vouchers/:code', requireAuth, requireRole('ADMIN'), commerceController.deleteVoucher);
commerceRouter.patch('/admin/products/:id', requireAuth, requireRole('ADMIN'), commerceController.moderateProduct);

// Shop Owner Seller Center Endpoints (Kênh Người Bán - khóa cứng khi Shop chưa APPROVED)
commerceRouter.get('/shop/dashboard', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), commerceController.getShopDashboard);
commerceRouter.patch('/shop/profile', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.updateShopProfile);
commerceRouter.post('/shop/bank-account/request-otp', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, registerRateLimiter, commerceController.requestShopBankOtp);
commerceRouter.patch('/shop/bank-account', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, registerRateLimiter, commerceController.updateShopBankAccount);
commerceRouter.post('/shop/suggest-description', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.suggestProductDescription);
commerceRouter.post('/shop/products', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.createShopProduct);
commerceRouter.patch('/shop/products/:id', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.updateShopProduct);
commerceRouter.delete('/shop/products/:id', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.deleteShopProduct);

// Product Reviews & Star Ratings Endpoints
commerceRouter.get('/products/:id/reviews', commerceController.listProductReviews);
commerceRouter.post('/products/:id/reviews', requireAuth, commerceController.createProductReview);
commerceRouter.patch('/reviews/:reviewId/reply', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.replyProductReview);
