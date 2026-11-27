import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();

describe('E-Commerce Hardening — Cart Persistence, Voucher Math & RBAC Security Contracts', () => {
  it('TC-COM-01: FashionStoreHome persists and isolates cartItems per userId via localStorage safely', () => {
    const storeHomeSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'features', 'ecommerce', 'FashionStoreHome.tsx'),
      'utf8'
    );
    assert.match(storeHomeSrc, /fv3d_smart_cart_v1_/);
    assert.match(storeHomeSrc, /getCartStorageKey/);
    assert.match(storeHomeSrc, /localStorage\.getItem\(getCartStorageKey\(currentUser\.id\)\)/);
    assert.match(storeHomeSrc, /localStorage\.setItem\(getCartStorageKey\(currentUser\.id\)/);
    assert.match(storeHomeSrc, /Array\.isArray\(parsed\)/);
  });

  it('TC-COM-02: CheckoutModal provides 1-click voucher chips, remove coupon, and clamps discount <= subtotal', () => {
    const checkoutSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'features', 'ecommerce', 'CheckoutModal.tsx'),
      'utf8'
    );
    assert.match(checkoutSrc, /availableVouchers/);
    assert.match(checkoutSrc, /applyVoucherByCode/);
    assert.match(checkoutSrc, /handleClearCoupon/);
    assert.match(checkoutSrc, /Math\.min\(subtotal,\s*Math\.round/);
  });

  it('TC-COM-03: CustomerProfileModal contains zero hardcoded fallback PII values in setFormData', () => {
    const profileSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'features', 'ecommerce', 'CustomerProfileModal.tsx'),
      'utf8'
    );
    assert.match(profileSrc, /phone:\s*details\.phone\s*\|\|\s*''/);
    assert.match(profileSrc, /city:\s*details\.city\s*\|\|\s*''/);
    assert.match(profileSrc, /address:\s*details\.address\s*\|\|\s*''/);
    assert.match(profileSrc, /notes:\s*details\.notes\s*\|\|\s*''/);
  });

  it('TC-COM-04: markOrderPaid blocks USER self-payment and server recomputes order pricing/transitions', () => {
    const repoSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'backend', 'src', 'modules', 'commerce', 'commerce.repository.ts'),
      'utf8'
    );
    const fnStart = repoSrc.indexOf('async markOrderPaid(');
    const fnEnd = repoSrc.indexOf('async ensureMembershipRow(', fnStart);
    const markOrderPaidBody = repoSrc.slice(fnStart, fnEnd);

    assert.match(markOrderPaidBody, /actor\.role === 'USER'/);
    assert.match(markOrderPaidBody, /throw new AppError\(\s*403,/);
    assert.match(repoSrc, /ALLOWED_ORDER_TRANSITIONS/);
    assert.match(repoSrc, /authoritativePrice/);
    assert.match(repoSrc, /ownerShop\.status !== 'APPROVED'/);
  });

  it('TC-COM-05: replyProductReview verifies shop ownership before updating product_reviews (anti-IDOR)', () => {
    const repoSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'backend', 'src', 'modules', 'commerce', 'commerce.repository.ts'),
      'utf8'
    );
    const ctrlSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'backend', 'src', 'modules', 'commerce', 'commerce.controller.ts'),
      'utf8'
    );

    assert.match(
      ctrlSrc,
      /commerceRepository\.replyProductReview\(reviewId,\s*reply,\s*\{\s*sub:\s*req\.user\.sub,\s*role:\s*req\.user\.role/
    );

    const fnStart = repoSrc.indexOf('async replyProductReview(');
    const fnBody = repoSrc.slice(fnStart);
    assert.match(fnBody, /INNER JOIN products p ON p\.id = r\.product_id/);
    assert.match(fnBody, /FROM shops WHERE owner_id = \$1/);
    assert.match(fnBody, /if \(!ownsProduct\)/);
    assert.match(fnBody, /throw new AppError\(\s*403,/);
  });

  it('TC-COM-06: cart prepends new items, supports selective checkboxes, and provides direct Buy Now checkout', () => {
    const storeHomeSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'features', 'ecommerce', 'FashionStoreHome.tsx'),
      'utf8'
    );
    const cartDrawerSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'features', 'ecommerce', 'SmartCartDrawer.tsx'),
      'utf8'
    );

    // Prepend newest item to top of cart
    assert.match(storeHomeSrc, /return \[updatedExisting,\s*\.\.\.others\]/);
    // Direct Quick Buy opens CheckoutModal without dumping into cart
    assert.match(storeHomeSrc, /const handleQuickBuy =/);
    assert.match(storeHomeSrc, /setQuickBuyItems\(/);
    // Selective checkout preserves unselected items
    assert.match(cartDrawerSrc, /selectedItems/);
    assert.match(cartDrawerSrc, /onToggleSelectItem/);
    assert.match(cartDrawerSrc, /onToggleSelectAll/);
  });

  it('TC-COM-07: User privacy cleanup, async checkout confirmation, 14-day swap copy, and ?product= deep-link work cleanly', () => {
    const dashSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'pages', 'Dashboard.tsx'), 'utf8');
    const authSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'context', 'AuthContext.tsx'), 'utf8');
    const checkoutSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'features', 'ecommerce', 'CheckoutModal.tsx'), 'utf8');
    const captureSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'features', 'capture', 'PhotoUploadCapture.tsx'), 'utf8');
    const storeHomeSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'features', 'ecommerce', 'FashionStoreHome.tsx'), 'utf8');
    const appSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'App.tsx'), 'utf8');

    assert.match(dashSrc, /resetScanState/);
    assert.match(authSrc, /clearTransientStudioPrivacyState/);
    assert.match(checkoutSrc, /await commerceApi\.createPayPalOrder\(/);
    assert.match(checkoutSrc, /await commerceApi\.capturePayPalOrder\(/);
    assert.match(checkoutSrc, /PayPal Escrow/);
    assert.doesNotMatch(checkoutSrc, /trong 7 ngày/);
    assert.match(captureSrc, /finalHeight < 3\.0/);
    assert.match(storeHomeSrc, /searchParams\.get\('product'\)/);
    assert.match(appSrc, /path="\/size-charts" element=\{<RequireStore>/);

    const adminSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'pages', 'AdminPortal.tsx'), 'utf8');
    const authModalSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'components', 'auth', 'AuthModal.tsx'), 'utf8');
    assert.doesNotMatch(adminSrc, /Cổng Đăng Nhập Quản Trị Viên/);
    assert.match(adminSrc, /onClick=\{openSignIn\}/);
    assert.match(authModalSrc, /adminOtpRequired/);
  });

  it('TC-COM-08: disburseShopPayouts uses Two-Phase DB Lock and resolves item-level FAILED/BLOCKED without batchStatus override', () => {
    const repoSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'backend', 'src', 'modules', 'commerce', 'commerce.repository.ts'),
      'utf8'
    );
    const ppSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'backend', 'src', 'modules', 'commerce', 'paypal.service.ts'),
      'utf8'
    );
    const adminSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'pages', 'AdminPortal.tsx'), 'utf8');
    const shopSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'pages', 'ShopPortal.tsx'), 'utf8');

    const fnStart = repoSrc.indexOf('async disburseShopPayouts(');
    const fnEnd = repoSrc.indexOf('async syncAdminPayoutStatus(', fnStart);
    const disburseBody = repoSrc.slice(fnStart, fnEnd);

    const lockPos = disburseBody.indexOf('FOR UPDATE');
    const processingPos = disburseBody.indexOf("SET payout_status = 'PROCESSING'");
    const apiPos = disburseBody.indexOf('paypalService.createBatchPayout(');
    assert.ok(lockPos > 0 && processingPos > lockPos && apiPos > processingPos);

    assert.match(repoSrc, /resolvePayPalPayoutItemOutcome\(/);
    assert.match(ppSrc, /itemError/);
    assert.match(adminSrc, /Lỗi PayPal:/);
    assert.match(shopSrc, /Đang xử lý PayPal/);
  });
});
