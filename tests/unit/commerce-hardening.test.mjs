import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();

describe('E-Commerce Hardening — Cart Persistence, Voucher Math & RBAC Security Contracts', () => {
  it('TC-COM-01: FashionStoreHome persists and restores cartItems via localStorage safely', () => {
    const storeHomeSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'features', 'ecommerce', 'FashionStoreHome.tsx'),
      'utf8'
    );
    assert.match(storeHomeSrc, /fv3d_smart_cart_v1/);
    assert.match(storeHomeSrc, /localStorage\.getItem\('fv3d_smart_cart_v1'\)/);
    assert.match(storeHomeSrc, /localStorage\.setItem\('fv3d_smart_cart_v1'/);
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

  it('TC-COM-04: markOrderPaid preserves Developer baseline owner check pending team lead review', () => {
    const repoSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'backend', 'src', 'modules', 'commerce', 'commerce.repository.ts'),
      'utf8'
    );
    const fnStart = repoSrc.indexOf('async markOrderPaid(');
    const fnEnd = repoSrc.indexOf('async ensureMembershipRow(', fnStart);
    const markOrderPaidBody = repoSrc.slice(fnStart, fnEnd);

    assert.match(markOrderPaidBody, /actor\.role === 'USER' && existing\.customer_id !== actor\.sub/);
    assert.match(markOrderPaidBody, /throw new AppError\(403,/);
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
});
