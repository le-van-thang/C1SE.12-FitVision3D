import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { calculateProductFit } from '../../src/features/ecommerce/fitCalculator.ts';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-BUY-W2-01: fitCalculator outputs trouser waist/hip guidance & dynamic score, and FitAnalysisDrawer checks Freeship >= 1M', () => {
  const samplePants = {
    id: 'prod-pants-w2',
    brand_name: 'Sartoria Milan',
    name: 'Quần Tây May Đo Wool',
    slug: 'quan-tay-wool',
    category: 'pants',
    gender_target: 'male',
    price: 1200000,
    rating: 4.9,
    reviews_count: 10,
    fabric_material: 'Wool',
    stretch_type: 'Không co giãn',
    image_url: '',
    description: '',
    variants: [
      {
        id: 'p-m',
        size_label: 'M',
        color_name: 'Đen',
        color_hex: '#111111',
        sku: 'PT-M',
        stock: 5,
        spec: { chest_cm: 0, waist_cm: 81, hip_cm: 98, shoulder_cm: 0, length_cm: 100, ease_min_cm: 2, ease_max_cm: 4 },
      },
    ],
  };

  const pantsFit = calculateProductFit(
    {
      height_cm: 175,
      weight_kg: 68,
      chest_cm: 96,
      waist_cm: 78,
      hip_cm: 95,
      shoulder_cm: 44,
      arm_length_cm: 60,
      inseam_cm: 80,
      gender: 'male',
    },
    samplePants
  );

  assert.match(pantsFit.advisor_advice_vi, /eo|hông/i);
  assert.doesNotMatch(pantsFit.advisor_advice_vi, /bờ vai|lồng ngực/);
  assert.doesNotMatch(pantsFit.advisor_advice_en, /chest and shoulders/);

  const fitCalcSrc = readRepoFile('src/features/ecommerce/fitCalculator.ts');
  assert.match(fitCalcSrc, /Vừa vặn hoàn hảo \(\$\{roundedScore\}%\)/);
  assert.doesNotMatch(fitCalcSrc, /Vừa vặn hoàn hảo \(98%\)/);

  const drawerSrc = readRepoFile('src/features/ecommerce/FitAnalysisDrawer.tsx');
  assert.match(drawerSrc, /\(product\.sale_price \|\| product\.price\) >= 1_000_000/);
});

test('TC-BUY-W2-02: CustomerProfileModal persists per-user settings, renders VietQR panel on unpaid orders, and uses SPA Link', () => {
  const profileSrc = readRepoFile('src/features/ecommerce/CustomerProfileModal.tsx');

  // Persisted per-user settings across controlled checkboxes and easePref
  assert.doesNotMatch(profileSrc, /defaultChecked/);
  assert.match(profileSrc, /fv3d_user_prefs_v1_/);
  assert.match(profileSrc, /checked=\{prefs\.autoEaseMatch\}/);
  assert.match(profileSrc, /checked=\{prefs\.emailOrderUpdates\}/);
  assert.match(profileSrc, /checked=\{prefs\.showBespokeBadge\}/);
  assert.match(profileSrc, /onClick=\{\(\) => updatePref\(\{ easePref: opt\.id \}\)\}/);

  // VietQR payment panel for pending/unpaid QR orders & SPA Link to /dashboard
  assert.match(profileSrc, /showQrReopen/);
  assert.match(profileSrc, /await refreshOrders\(\)/);
  assert.match(profileSrc, /<Link\s+to="\/dashboard"/);
  assert.doesNotMatch(profileSrc, /<a\s+href="\/dashboard"/);
});

test('TC-BUY-W2-03: FashionStoreHome aligns Hero prod-05 price, removes ATM/Visa badge, uses SPA Link, and syncs default weight placeholder', () => {
  const storeSrc = readRepoFile('src/features/ecommerce/FashionStoreHome.tsx');
  const captureSrc = readRepoFile('src/features/capture/PhotoUploadCapture.tsx');

  // Aligns Hero Blazer originalPrice to 1,850,000 and removes ATM / Visa payment badge
  assert.match(storeSrc, /productId:\s*'prod-05'[\s\S]*?originalPrice:\s*1850000/);
  assert.doesNotMatch(storeSrc, /ATM \/ Visa/);

  // Zero internal full-reload <a href="/..."> links inside FashionStoreHome
  assert.doesNotMatch(storeSrc, /<a\s[^>]*href="\/(?:dashboard|shop|admin)?"/);

  // PhotoUploadCapture placeholder matches 70kg fallback
  assert.match(captureSrc, /placeholder="VD: 70"/);
});
