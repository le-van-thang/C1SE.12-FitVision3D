import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-UX-01: 3D viewer isolates stacking below header, disables free zoom, and preserves zone presets', () => {
  const navSrc = readRepoFile('src/components/common/Navbar.tsx');
  const dashSrc = readRepoFile('src/pages/Dashboard.tsx');
  const viewerSrc = readRepoFile('src/features/avatar3d/MannequinViewer.tsx');

  assert.match(navSrc, /sticky top-0 z-50/);
  assert.match(dashSrc, /relative z-0 isolate/);
  assert.match(viewerSrc, /isolation:\s*["']isolate["']/);
  assert.match(viewerSrc, /controls\.enableZoom\s*=\s*false/);
  assert.match(viewerSrc, /shoulders_arms/);
  assert.match(viewerSrc, /legs/);
});

test('TC-UX-02: Sample photo / demo buttons and noisy DB toast jargon are removed', () => {
  const navSrc = readRepoFile('src/components/common/Navbar.tsx');
  const dashSrc = readRepoFile('src/pages/Dashboard.tsx');
  const capSrc = readRepoFile('src/features/capture/PhotoUploadCapture.tsx');
  const orderCtxSrc = readRepoFile('src/context/OrderContext.tsx');
  const drawerSrc = readRepoFile('src/features/ecommerce/FitAnalysisDrawer.tsx');

  assert.doesNotMatch(navSrc, /btn-demo-mode|Tải dữ liệu mẫu/);
  assert.doesNotMatch(dashSrc, /handleLoadDemo/);
  assert.doesNotMatch(capSrc, /loadSamplePhoto/);
  assert.doesNotMatch(orderCtxSrc, /Đã lưu cục bộ|lưu hệ thống/);
  assert.doesNotMatch(drawerSrc, /đã được lưu vào PostgreSQL/);
});

test('TC-UX-03: Visitor role gating, Free Size Picker + AI suggestion, Cart vs Quick Buy, and Bespoke labels work cleanly', () => {
  const storeSrc = readRepoFile('src/features/ecommerce/FashionStoreHome.tsx');
  const drawerSrc = readRepoFile('src/features/ecommerce/FitAnalysisDrawer.tsx');
  const cartSrc = readRepoFile('src/features/ecommerce/SmartCartDrawer.tsx');
  const shopSrc = readRepoFile('src/pages/ShopPortal.tsx');
  const repoSrc = readRepoFile('backend/src/modules/commerce/commerce.repository.ts');

  assert.match(storeSrc, /requireAuthenticatedAction/);
  assert.match(storeSrc, /handleQuickBuy/);
  assert.match(storeSrc, /selectedSizeByProduct/);
  assert.match(storeSrc, /Visitor/);
  assert.match(drawerSrc, /\(spec\.chest_cm - userBody\.chest_cm\)\.toFixed\(1\)/);
  assert.match(drawerSrc, /\(spec\.waist_cm - userBody\.waist_cm\)\.toFixed\(1\)/);
  assert.match(drawerSrc, /onQuickBuy/);
  assert.match(cartSrc, /May Đo Bespoke/);
  assert.match(shopSrc, /newIsBespoke/);
  assert.match(repoSrc, /const isBespoke = Boolean\(payload\.isBespoke/);
});

