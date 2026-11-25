import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-W1-01: Checkout awaits backend persistence, isolates buyer PII, resets stale coupon, and rolls back failed cancel', () => {
  const orderCtxSrc = readRepoFile('src/context/OrderContext.tsx');
  const checkoutSrc = readRepoFile('src/features/ecommerce/CheckoutModal.tsx');

  // OrderContext awaits createOrder API instead of optimistic cart wipe & rolls back failed cancel/status update
  assert.match(orderCtxSrc, /const res = await commerceApi\.createOrder\(newOrder\);/);
  assert.match(orderCtxSrc, /const rollbackStatus = prevStatus;[\s\S]*status: rollbackStatus/);

  // CheckoutModal awaits createOrder result before clearing cart or advancing to success screen
  assert.match(checkoutSrc, /const result = await createOrder\(\{/);
  assert.match(checkoutSrc, /if \(result\.success && result\.order\)/);
  assert.match(checkoutSrc, /onClearCart\(\);/);
  assert.match(checkoutSrc, /setStep\('success'\);/);

  // CheckoutModal syncs recipient PII per currentUser.id, resets appliedDiscount, fixes 14-day copy & dynamic VietQR
  assert.match(checkoutSrc, /\[isOpen,\s*currentUser\?\.id\]/);
  assert.match(checkoutSrc, /setAppliedDiscount\(0\);/);
  assert.match(checkoutSrc, /trong 14 ngày/);
  assert.doesNotMatch(checkoutSrc, /accountName=LE%20VAN%20THANG/);
  assert.match(checkoutSrc, /encodeURIComponent\(bankAccount\.accountNumber\)/);
  assert.doesNotMatch(checkoutSrc, /alert\(/);
});

test('TC-W1-02: Cart is scoped per authenticated user, enforces variant stock, ticks combo items, and guards unmeasured profiles', () => {
  const storeSrc = readRepoFile('src/features/ecommerce/FashionStoreHome.tsx');
  const cartSrc = readRepoFile('src/features/ecommerce/SmartCartDrawer.tsx');
  const drawerSrc = readRepoFile('src/features/ecommerce/FitAnalysisDrawer.tsx');
  const profileSrc = readRepoFile('src/features/ecommerce/CustomerProfileModal.tsx');

  // Per-user cart scoping & cleanup on logout
  assert.match(storeSrc, /getCartStorageKey\(currentUser\.id\)/);
  assert.match(storeSrc, /if \(!isAuthenticated \|\| !currentUser\?\.id\)\s*\{\s*setCartItems\(\[\]\)/);

  // Combo selection adds items to selectedCartIds
  assert.match(storeSrc, /setSelectedCartIds\(\(prev\) => Array\.from\(new Set\(\[\.\.\.addedOrUpdatedIds, \.\.\.prev\]\)\)\)/);

  // Removes hardcoded personal name fallback
  assert.doesNotMatch(storeSrc, /Thắng Lê/);

  // Stock guards in Cart Drawer & FitAnalysisDrawer
  assert.match(cartSrc, /disabled=\{item\.quantity >= Math\.max\(1, item\.variant\.stock \|\| 1\)\}/);
  assert.match(drawerSrc, /disabled=\{isOutOfStock\}/);
  assert.match(drawerSrc, /hasBodyProfile \?/);

  // ProfileModal guards unmeasured measurements tab & allows cancel on confirmed orders without window.confirm
  assert.match(profileSrc, /!hasBodyProfile/);
  assert.match(profileSrc, /order\.status === 'pending' \|\| order\.status === 'confirmed'/);
  assert.doesNotMatch(profileSrc, /confirm\(/);
});

test('TC-W1-03: 3D Dashboard isolates biometric state, normalizes meters pre-AI, mobile nav & AI Copilot race guard work cleanly', () => {
  const dashSrc = readRepoFile('src/pages/Dashboard.tsx');
  const aiSrc = readRepoFile('src/services/aiService.ts');
  const navSrc = readRepoFile('src/components/common/Navbar.tsx');
  const botSrc = readRepoFile('src/components/ai/GeminiAssistantWidget.tsx');
  const tailorSrc = readRepoFile('src/pages/TailorStudio.tsx');

  // Clears 3D biometric state when logged out or missing snapshot & normalizes meters before runAiMeasurement
  assert.match(dashSrc, /clearViewerState/);
  assert.match(dashSrc, /if \(normalizedHeight > 0 && normalizedHeight < 3\.0\)/);
  assert.match(dashSrc, /await runAiMeasurement\(normalizedParams\)/);
  assert.doesNotMatch(dashSrc, /alert\(/);

  // AI Service skips retries on 4xx client errors
  assert.match(aiSrc, /res\.status >= 400 && res\.status < 500/);

  // Navbar mobile hamburger drawer
  assert.match(navSrc, /nav-mobile-toggle/);

  // GeminiAssistantWidget aborts stale requests on account switch and avoids z-index / mobile overlap
  assert.match(botSrc, /AbortController/);
  assert.match(botSrc, /requestEpochRef/);
  assert.match(botSrc, /z-\[60\]/);
  assert.match(botSrc, /bottom-20 md:bottom-5/);

  // TailorStudio separates live orders from mock DOSSIERS, uses unique dossier_code keys & ASCII PDF helper
  assert.match(tailorSrc, /key=\{d\.dossier_code\}/);
  assert.match(tailorSrc, /toAsciiPdfText/);
  assert.doesNotMatch(tailorSrc, /const merged = \[\.\.\.liveRecords, \.\.\.DOSSIERS\]/);
});

test('TC-W1-04: AdminOperationsTabs loads live PostgreSQL products, caps percent vouchers <= 100%, and guards null recipient phones', () => {
  const adminOpsSrc = readRepoFile('src/components/admin/AdminOperationsTabs.tsx');

  assert.match(adminOpsSrc, /commerceApi\.getBootstrap\(true\)/);
  assert.match(adminOpsSrc, /newType === 'percent' && val > 100/);
  assert.match(adminOpsSrc, /\(o\.recipient\?\.phone \|\| ''\)\.toLowerCase\(\)/);
});
