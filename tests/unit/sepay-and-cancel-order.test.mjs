import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-FLOW-01: PayPal Orders v2, Capture, Cancel Pending, and Webhook verification routes & services exist', () => {
  const routesSrc = readRepoFile('backend/src/modules/commerce/commerce.routes.ts');
  const ctrlSrc = readRepoFile('backend/src/modules/commerce/commerce.controller.ts');
  const repoSrc = readRepoFile('backend/src/modules/commerce/commerce.repository.ts');
  const paypalSvcSrc = readRepoFile('backend/src/modules/commerce/paypal.service.ts');

  assert.match(routesSrc, /get\(['"]\/paypal\/config['"]/);
  assert.match(routesSrc, /post\(['"]\/paypal\/create-order['"]/);
  assert.match(routesSrc, /post\(['"]\/paypal\/capture-order['"]/);
  assert.match(routesSrc, /post\(['"]\/paypal\/cancel-pending['"]/);
  assert.match(routesSrc, /post\(['"]\/paypal\/webhook['"]/);

  assert.match(ctrlSrc, /async createPayPalOrder\(/);
  assert.match(ctrlSrc, /async capturePayPalOrder\(/);
  assert.match(ctrlSrc, /async handlePayPalWebhook\(/);

  assert.match(repoSrc, /async createPayPalCheckoutGroup\(/);
  assert.match(repoSrc, /item\?\.product_id \|\| item\?\.product\?\.id/);
  assert.match(repoSrc, /item\?\.size_label \|\| item\?\.variant\?\.size_label/);
  assert.match(repoSrc, /FROM products WHERE id = ANY/);
  assert.match(repoSrc, /async finalizePayPalOrdersAsPaid\(/);
  assert.match(repoSrc, /async capturePayPalOrderForActor\(/);
  assert.match(repoSrc, /async cancelPendingPayPalGroup\(/);
  assert.match(paypalSvcSrc, /verifyWebhookSignature\(/);
  assert.match(paypalSvcSrc, /createBatchPayout\(/);
});

test('TC-FLOW-02: OrderContext uses PayPal capture recording & unpaid guard blocks premature shop fulfillment', () => {
  const orderCtxSrc = readRepoFile('src/context/OrderContext.tsx');
  const checkoutSrc = readRepoFile('src/features/ecommerce/CheckoutModal.tsx');
  const repoSrc = readRepoFile('backend/src/modules/commerce/commerce.repository.ts');

  assert.doesNotMatch(
    orderCtxSrc,
    /payment_method\s*===\s*['"]vietqr_sepay['"]\s*\?\s*['"]paid['"]/
  );
  assert.match(orderCtxSrc, /recordCapturedOrders/);
  assert.match(orderCtxSrc, /commerceApi\.updateOrderStatus\(orderId,\s*['"]cancelled['"]\)/);

  assert.match(checkoutSrc, /PayPalSmartButton/);
  assert.match(checkoutSrc, /commerceApi\.createPayPalOrder\(/);
  assert.match(checkoutSrc, /commerceApi\.capturePayPalOrder\(/);
  assert.match(checkoutSrc, /recordCapturedOrders\(/);
  assert.doesNotMatch(checkoutSrc, /vietqr_sepay|bankAccount/);

  // Backend blocks confirmed/tailoring/shipping/completed when PayPal order is still unpaid
  assert.match(repoSrc, /Đơn hàng chưa hoàn tất thanh toán PayPal/);
});

test('TC-FLOW-03: Navbar exposes Shop Portal (/shop), Vite serves / to SPA, and ShopPortal <-> TailorStudio connect via orderId & jsPDF', () => {
  const navSrc = readRepoFile('src/components/common/Navbar.tsx');
  const viteSrc = readRepoFile('vite.config.ts');
  const shopSrc = readRepoFile('src/pages/ShopPortal.tsx');
  const tailorSrc = readRepoFile('src/pages/TailorStudio.tsx');
  const storeSrc = readRepoFile('src/features/ecommerce/FashionStoreHome.tsx');

  assert.match(navSrc, /to="\/shop"/);
  assert.match(viteSrc, /\/landing/);
  assert.match(shopSrc, /\/tailor\?orderId=/);
  assert.match(shopSrc, /handleUpdateOrderStatus/);
  assert.match(tailorSrc, /useSearchParams/);
  assert.match(tailorSrc, /orderToDossier/);
  assert.match(tailorSrc, /new jsPDF\(/);
  assert.match(tailorSrc, /dossiers\.map\(/);
  assert.match(storeSrc, /handleOrderBespoke3D/);
});
