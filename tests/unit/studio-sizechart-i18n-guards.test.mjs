import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-3D-W2-01: SizeChartManager persists edits per brand/gender/category, simulates bottoms by waist, and routes Back by role', () => {
  const src = readRepoFile('src/pages/SizeChartManager.tsx');

  assert.match(src, /fv3d_size_chart_v1_/);
  assert.match(src, /localStorage\.setItem\(getSizeChartStorageKey/);
  assert.match(src, /localStorage\.removeItem\(getSizeChartStorageKey/);
  assert.match(src, /isBottomCategory/);
  assert.match(src, /effWaist >= \(r\.min_waist \?\? 0\) && effWaist <= \(r\.max_waist \?\? 0\)/);
  assert.match(src, /userRole === "admin" \? "\/admin" : userRole === "store" \? "\/shop" : "\/dashboard"/);
});

test('TC-3D-W2-02: MannequinViewer prioritizes i18n zones & cm units, Navbar gates /size-charts cleanly, and Dashboard removes usr-current', () => {
  const viewerSrc = readRepoFile('src/features/avatar3d/MannequinViewer.tsx');
  const navSrc = readRepoFile('src/components/common/Navbar.tsx');
  const dashSrc = readRepoFile('src/pages/Dashboard.tsx');
  const storageSrc = readRepoFile('src/utils/bodyProfileStorage.ts');

  assert.match(viewerSrc, /t\(`viewer\.zone\.\$\{currentZone\}`, VIEW_LABELS\[currentZone\]\)/);
  assert.match(viewerSrc, /`\$\{val\.toFixed\(1\)\} cm`/);

  assert.doesNotMatch(navSrc, /'retailer'/);
  const sizeChartNavMatches = navSrc.match(/isAuthenticated && \(isStore \|\| isAdmin\)/g) || [];
  assert.equal(sizeChartNavMatches.length, 2, 'Expected role-gated /size-charts in both desktop and mobile nav');

  assert.doesNotMatch(dashSrc, /usr-current/);
  assert.match(storageSrc, /clearFullScanSnapshot[\s\S]*localStorage\.removeItem\(getBodyKey\(userId\)\)/);
});

test('TC-3D-W2-03: SmartCartDrawer translates Bespoke badge, i18n bundles match zone keys, and CI strictly runs i18n:check', () => {
  const cartSrc = readRepoFile('src/features/ecommerce/SmartCartDrawer.tsx');
  const ciSrc = readRepoFile('.github/workflows/ci.yml');
  const viJson = JSON.parse(readRepoFile('src/i18n/vi.json'));
  const enJson = JSON.parse(readRepoFile('src/i18n/en.json'));

  assert.match(cartSrc, /isEn \? '✂️ Bespoke Tailoring · 13 3D Measurements' : '✂️ May Đo Bespoke · 13 số đo 3D'/);
  assert.ok(viJson.viewer?.zone?.shoulders_arms && viJson.viewer?.zone?.legs);
  assert.ok(enJson.viewer?.zone?.shoulders_arms && enJson.viewer?.zone?.legs);

  assert.match(ciSrc, /run:\s*npm run i18n:check/);
  assert.doesNotMatch(ciSrc, /continue-on-error:\s*true/);
});
