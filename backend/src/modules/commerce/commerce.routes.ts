import { Router } from 'express';
import { commerceController } from './commerce.controller.js';
import { requireApprovedShop, requireAuth, requireRole } from '../../middlewares/authGuard.js';
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

// Orders & PayPal Checkout (Orders v2 + Webhook)
commerceRouter.get('/paypal/config', commerceController.getPayPalConfig);
commerceRouter.post('/paypal/create-order', requireAuth, commerceController.createPayPalOrder);
commerceRouter.post('/paypal/capture-order', requireAuth, commerceController.capturePayPalOrder);
commerceRouter.post('/paypal/cancel-pending', requireAuth, commerceController.cancelPendingPayPalOrder);
commerceRouter.post('/paypal/webhook', commerceController.handlePayPalWebhook);

commerceRouter.get('/orders', requireAuth, commerceController.getOrders);
commerceRouter.post('/orders', requireAuth, commerceController.createOrder);
commerceRouter.patch(
  '/orders/:id/status',
  requireAuth,
  commerceController.updateOrderStatus
);
commerceRouter.patch('/orders/:id/pay', requireAuth, commerceController.markOrderPaid);

// Real PostgreSQL Membership Endpoints (Authenticated user)
commerceRouter.get('/membership', requireAuth, commerceController.getMembership);
commerceRouter.post('/membership/check-in', requireAuth, commerceController.checkInMembership);
commerceRouter.post('/membership/redeem', requireAuth, commerceController.redeemMembershipVoucher);

// Admin CMS, Catalog & Escrow Payout Endpoints
commerceRouter.put('/admin/settings', requireAuth, requireRole('ADMIN'), commerceController.saveSettings);
commerceRouter.post('/admin/vouchers', requireAuth, requireRole('ADMIN'), commerceController.createVoucher);
commerceRouter.patch('/admin/vouchers/:code', requireAuth, requireRole('ADMIN'), commerceController.updateVoucher);
commerceRouter.delete('/admin/vouchers/:code', requireAuth, requireRole('ADMIN'), commerceController.deleteVoucher);
commerceRouter.patch('/admin/products/:id', requireAuth, requireRole('ADMIN'), commerceController.moderateProduct);
commerceRouter.get('/admin/payouts', requireAuth, requireRole('ADMIN'), commerceController.getAdminPayouts);
commerceRouter.post('/admin/payouts/disburse', requireAuth, requireRole('ADMIN'), commerceController.disburseAdminPayouts);
commerceRouter.post('/admin/payouts/:id/sync', requireAuth, requireRole('ADMIN'), commerceController.syncAdminPayoutBatch);

// Shop Owner Seller Center Endpoints (Kênh Người Bán - khóa cứng khi Shop chưa APPROVED)
commerceRouter.get('/shop/dashboard', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), commerceController.getShopDashboard);
commerceRouter.get('/shop/payouts', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.getShopPayouts);
commerceRouter.put('/shop/paypal-account', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.updateShopPayPalAccount);
commerceRouter.patch('/shop/profile', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.updateShopProfile);
commerceRouter.post('/shop/suggest-description', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.suggestProductDescription);
commerceRouter.post('/shop/products', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.createShopProduct);
commerceRouter.patch('/shop/products/:id', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.updateShopProduct);
commerceRouter.delete('/shop/products/:id', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.deleteShopProduct);

// Product Reviews & Star Ratings Endpoints
commerceRouter.get('/products/:id/reviews', commerceController.listProductReviews);
commerceRouter.post('/products/:id/reviews', requireAuth, commerceController.createProductReview);
commerceRouter.patch('/reviews/:reviewId/reply', requireAuth, requireRole('SHOP_OWNER', 'ADMIN'), requireApprovedShop, commerceController.replyProductReview);
