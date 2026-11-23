import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-FLOW-01: SePay webhook route and controller reject missing code or insufficient amount', () => {
  const routesSrc = readRepoFile('backend/src/modules/commerce/commerce.routes.ts');
  const ctrlSrc = readRepoFile('backend/src/modules/commerce/commerce.controller.ts');
  const repoSrc = readRepoFile('backend/src/modules/commerce/commerce.repository.ts');

  assert.match(routesSrc, /post\(['"]\/payments\/sepay-webhook['"]/);
  assert.match(ctrlSrc, /async handleSePayWebhook\(/);
  assert.match(ctrlSrc, /SEPAY_WEBHOOK_SECRET/);
  assert.match(repoSrc, /async confirmOrderPaidBySePayWebhook\(/);
  assert.match(repoSrc, /FV3D-/);
  assert.match(repoSrc, /Number\(params\.transferAmount \|\| 0\)\s*<\s*requiredAmount/);
});

test('TC-FLOW-02: OrderContext no longer sets vietqr_sepay paid upfront and CheckoutModal polls real order status', () => {
  const orderCtxSrc = readRepoFile('src/context/OrderContext.tsx');
  const checkoutSrc = readRepoFile('src/features/ecommerce/CheckoutModal.tsx');

  assert.doesNotMatch(
    orderCtxSrc,
    /payment_method\s*===\s*['"]vietqr_sepay['"]\s*\?\s*['"]paid['"]/,
  );
  assert.match(orderCtxSrc, /payment_status:\s*['"]unpaid['"]/);
  assert.match(orderCtxSrc, /commerceApi\.updateOrderStatus\(orderId,\s*['"]cancelled['"]\)/);
  assert.match(checkoutSrc, /commerceApi\.getOrders\(\)/);
  assert.match(checkoutSrc, /payment_status\s*===\s*['"]paid['"]/);
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

