import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  normalizePrepTimeCode,
  formatPrepTimeLabel,
  isValidShopImageUrl,
  isValidProductVideoUrl,
  addCustomColorWithoutToggle,
  sanitizeStockInput,
  parseStockDraft,
} from '../../src/components/shop/settings/shopSettingsHelpers.ts';

test('normalizePrepTimeCode maps legacy Vietnamese strings and canonical codes', () => {
  assert.equal(normalizePrepTimeCode('SAME_DAY'), 'SAME_DAY');
  assert.equal(normalizePrepTimeCode('Trong ngày (24h)'), 'SAME_DAY');
  assert.equal(normalizePrepTimeCode('1–2 ngày làm việc'), '1_2_DAYS');
  assert.equal(normalizePrepTimeCode('2–3 ngày làm việc'), '2_3_DAYS');
  assert.equal(normalizePrepTimeCode('3–5 ngày (Hàng đặt trước)'), '3_5_DAYS');
  assert.equal(normalizePrepTimeCode(null), '1_2_DAYS');
});

test('formatPrepTimeLabel localizes prep time codes cleanly in VI and EN', () => {
  assert.equal(formatPrepTimeLabel('SAME_DAY', 'vi'), 'Trong ngày (24h)');
  assert.equal(formatPrepTimeLabel('SAME_DAY', 'en'), 'Same day (24h)');
  assert.equal(formatPrepTimeLabel('2–3 ngày làm việc', 'en'), '2–3 business days');
});

test('isValidShopImageUrl accepts safe http(s)/base64 images and rejects CSS/JS injection', () => {
  assert.equal(isValidShopImageUrl(''), true);
  assert.equal(isValidShopImageUrl('https://cdn.example.com/logo.png'), true);
  assert.equal(isValidShopImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true);
  assert.equal(isValidShopImageUrl('javascript:alert(1)'), false);
  assert.equal(isValidShopImageUrl('https://a.com/x.png"); background:red;'), false);
  assert.equal(isValidShopImageUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
});

test('addCustomColorWithoutToggle prevents accidental deletion when adding a duplicate color name or hex', () => {
  const initial = [
    { colorName: 'Trắng Kem', colorHex: '#F3F4F6', imageUrl: '' },
    { colorName: 'Xanh Navy', colorHex: '#1E3A8A', imageUrl: '' },
  ];

  const dupByName = addCustomColorWithoutToggle(initial, { name: 'xanh navy', hex: '#1E3A99' });
  assert.equal(dupByName.status, 'duplicate');
  assert.equal(dupByName.variants.length, 2);

  const dupByHex = addCustomColorWithoutToggle(initial, { name: 'Navy Dark', hex: '#1e3a8a' });
  assert.equal(dupByHex.status, 'duplicate');
  assert.equal(dupByHex.variants.length, 2);

  const added = addCustomColorWithoutToggle(initial, { name: 'Xanh Cổ Vịt', hex: '#0F766E' });
  assert.equal(added.status, 'added');
  assert.equal(added.variants.length, 3);
  assert.equal(added.variants[2].colorName, 'Xanh Cổ Vịt');
});

test('sanitizeStockInput & parseStockDraft allow clearing to empty, preserve 0, clamp 0..999, and truncate decimals', () => {
  assert.equal(sanitizeStockInput(''), '');
  assert.equal(sanitizeStockInput('0'), '0');
  assert.equal(sanitizeStockInput('35'), '35');
  assert.equal(sanitizeStockInput('1500'), '999');
  assert.equal(sanitizeStockInput('12abc'), '12');

  assert.equal(parseStockDraft(0, 20), 0);
  assert.equal(parseStockDraft('0', 20), 0);
  assert.equal(parseStockDraft('', 20), 20);
  assert.equal(parseStockDraft('35.8', 20), 35);
  assert.equal(parseStockDraft('9999', 20), 999);
  assert.equal(parseStockDraft('-5', 20), 0);
});

test('isValidProductVideoUrl accepts https/mp4/webm and rejects javascript/html payloads', () => {
  assert.equal(isValidProductVideoUrl(''), true);
  assert.equal(isValidProductVideoUrl('https://cdn.example.com/demo.mp4'), true);
  assert.equal(isValidProductVideoUrl('data:video/mp4;base64,AAAA'), true);
  assert.equal(isValidProductVideoUrl('javascript:alert(1)'), false);
  assert.equal(isValidProductVideoUrl('data:text/html;base64,PHNjcmlwdD4='), false);
});

test('PR #30 security & integrity contracts: rate limits, no public owner_id, preserve EN fields, strict BANK_CHANGE OTP, Google first-time password, and AuthContext signIn authProvider', () => {
  const root = process.cwd();
  const authRoutes = fs.readFileSync(path.join(root, 'backend/src/modules/auth/auth.routes.ts'), 'utf8');
  const authService = fs.readFileSync(path.join(root, 'backend/src/modules/auth/auth.service.ts'), 'utf8');
  const emailService = fs.readFileSync(path.join(root, 'backend/src/services/email.service.ts'), 'utf8');
  const commerceRoutes = fs.readFileSync(path.join(root, 'backend/src/modules/commerce/commerce.routes.ts'), 'utf8');
  const commerceRepo = fs.readFileSync(path.join(root, 'backend/src/modules/commerce/commerce.repository.ts'), 'utf8');
  const authCtx = fs.readFileSync(path.join(root, 'src/context/AuthContext.tsx'), 'utf8');

  // Rate limiters on change-password, logout-all, and bank-account routes
  assert.match(authRoutes, /\/change-password['"],\s*requireAuth,\s*registerRateLimiter/);
  assert.match(authRoutes, /\/logout-all['"],\s*requireAuth,\s*registerRateLimiter/);
  assert.match(commerceRoutes, /\/shop\/bank-account\/request-otp['"],[\s\S]*registerRateLimiter/);
  assert.match(commerceRoutes, /\/shop\/bank-account['"],[\s\S]*registerRateLimiter/);

  // Strict BANK_CHANGE OTP (no 123456 bypass)
  assert.match(emailService, /type !== 'ADMIN_2FA' && type !== 'BANK_CHANGE'/);

  // Google user first-time password creation allowed (aligned with PR #29)
  assert.match(authService, /isFirstTimeGooglePassword\s*=\s*isGoogleOAuthHash/);

  // Public storefront query does not expose owner_id
  const publicStorefrontSlice = commerceRepo.slice(
    commerceRepo.indexOf('async getPublicStorefrontBySlug'),
    commerceRepo.indexOf('async updateShopProfile')
  );
  assert.equal(publicStorefrontSlice.includes('owner_id'), false);

  // updateShopProduct preserves name_en, fabric_material_en, description_en
  const updateProdSlice = commerceRepo.slice(
    commerceRepo.indexOf('async updateShopProduct'),
    commerceRepo.indexOf('async deleteShopProduct')
  );
  assert.match(updateProdSlice, /name_en = \$3/);
  assert.match(updateProdSlice, /fabric_material_en = \$11/);
  assert.match(updateProdSlice, /description_en = \$17/);

  // AuthContext signIn syncs authProvider
  const signInSlice = authCtx.slice(authCtx.indexOf('const signIn ='), authCtx.indexOf('// 2. Register'));
  assert.match(signInSlice, /setAuthProvider\(/);
});
