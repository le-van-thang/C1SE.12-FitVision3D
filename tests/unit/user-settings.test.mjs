import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  detectCurrentDevice,
  evaluatePasswordStrength,
  normalizeBankHolderName,
} from '../../src/components/settings/userSettingsHelpers.ts';
import { calculateProductFit } from '../../src/features/ecommerce/fitCalculator.ts';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
const readRepo = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

test('TC-SETTINGS-01: device detector, password strength (6-32 chars), and bank holder normalizer work cleanly', () => {
  const winChrome = detectCurrentDevice(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36'
  );
  assert.equal(winChrome.browser, 'Chrome');
  assert.equal(winChrome.os, 'Windows');

  const macSafari = detectCurrentDevice(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15'
  );
  assert.equal(macSafari.browser, 'Safari');
  assert.equal(macSafari.os, 'macOS');

  assert.equal(evaluatePasswordStrength('').score, 0);
  assert.equal(evaluatePasswordStrength('abc').level, 'weak');
  assert.equal(evaluatePasswordStrength('Abc123!').level, 'strong');

  assert.equal(normalizeBankHolderName('Nguyễn Văn Đạt'), 'NGUYEN VAN DAT');
});

test('TC-SETTINGS-02: easeAllowancePreference actively adjusts calculateProductFit recommendation', () => {
  const body = {
    height_cm: 172,
    weight_kg: 68,
    chest_cm: 94,
    waist_cm: 80,
    hip_cm: 94,
    shoulder_cm: 43,
    gender: 'male',
  };
  const product = {
    id: 'shirt-test',
    name: 'Test Shirt',
    brand_name: 'Atelier',
    category: 'shirt',
    price: 500000,
    image_url: '',
    description: '',
    rating: 5,
    sold_count: 1,
    variants: [
      { id: 's', size_label: 'S', color_name: 'White', color_hex: '#fff', sku: 'S', stock: 5, spec: { chest_cm: 96, waist_cm: 82, shoulder_cm: 43, length_cm: 70, ease_min_cm: 2, ease_max_cm: 5 } },
      { id: 'm', size_label: 'M', color_name: 'White', color_hex: '#fff', sku: 'M', stock: 5, spec: { chest_cm: 100, waist_cm: 86, shoulder_cm: 44, length_cm: 72, ease_min_cm: 2, ease_max_cm: 5 } },
      { id: 'l', size_label: 'L', color_name: 'White', color_hex: '#fff', sku: 'L', stock: 5, spec: { chest_cm: 104, waist_cm: 90, shoulder_cm: 45, length_cm: 74, ease_min_cm: 2, ease_max_cm: 5 } },
    ],
  };

  const slimFit = calculateProductFit(body, product, 'slim');
  const relaxedFit = calculateProductFit(body, product, 'relaxed');
  assert.equal(slimFit.recommended_size, 'S');
  assert.equal(relaxedFit.recommended_size, 'M');
  assert.notEqual(slimFit.recommended_size, relaxedFit.recommended_size);
});

test('TC-SETTINGS-03: backend blocks LOCKED accounts (including requireAuth), guards self-lock to USER, logs audit events, throws 503 on DB down, and unifies /logout-all', () => {
  const authService = readRepo('backend/src/modules/auth/auth.service.ts');
  const authGuard = readRepo('backend/src/middlewares/authGuard.ts');
  const authRepo = readRepo('backend/src/modules/auth/auth.repository.ts');
  const authRoutes = readRepo('backend/src/modules/auth/auth.routes.ts');
  const settingsRepo = readRepo('backend/src/modules/userSettings/userSettings.repository.ts');
  const settingsCtrl = readRepo('backend/src/modules/userSettings/userSettings.controller.ts');

  assert.match(authService, /user\.status === 'LOCKED'/);
  assert.match(authGuard, /status === 'LOCKED'/);
  assert.match(authGuard, /status === 'BANNED'/);
  assert.match(authService, /user\.role !== 'USER'/);
  assert.match(authService, /actionType: 'USER_DELETE_3D_DATA'/);
  assert.match(authService, /actionType: 'USER_SELF_LOCK'/);
  assert.match(authRepo, /if \(!\(await isDbAvailable\(\)\)\) \{\s*throw new AppError\(\s*503/);

  assert.match(authRoutes, /\/change-password.*sensitiveActionRateLimiter/);
  assert.match(authRoutes, /\/logout-all/);
  assert.doesNotMatch(authRoutes, /\/revoke-all-sessions/);

  assert.match(settingsRepo, /CREATE TABLE IF NOT EXISTS user_profiles/);
  assert.match(settingsRepo, /birth_date DATE/);
  assert.match(settingsRepo, /UPDATE users SET full_name = \$1/);
  assert.match(settingsCtrl, /\^https:\\\/\\\//);
  assert.match(settingsRepo, /CREATE TABLE IF NOT EXISTS user_addresses/);
  assert.match(settingsRepo, /CREATE TABLE IF NOT EXISTS user_refund_banks/);
  assert.match(settingsRepo, /CREATE TABLE IF NOT EXISTS user_preferences/);
});

test('TC-SETTINGS-04: frontend checks server success, validates phone .valid, isolates /settings role, and removes mock/Shopee copy', () => {
  const authCtx = readRepo('src/context/AuthContext.tsx');
  const profileTab = readRepo('src/components/settings/ProfileTab.tsx');
  const addressTab = readRepo('src/components/settings/AddressBookTab.tsx');
  const securityTab = readRepo('src/components/settings/SecurityTab.tsx');
  const appSrc = readRepo('src/App.tsx');
  const profileModal = readRepo('src/features/ecommerce/CustomerProfileModal.tsx');

  assert.match(authCtx, /const res = await authApi\.deleteMy3DData\(\);\s*if \(!res\.success\)/);
  assert.match(authCtx, /const res = await authApi\.requestAccountLock\(\);\s*if \(!res\.success\)/);
  assert.match(authCtx, /const res = await authApi\.logoutAll\(\);\s*if \(!res\.success\)/);
  assert.doesNotMatch(authCtx, /0988 123 456/);

  assert.match(profileTab, /validatePhoneNumber\(phone\.trim\(\)\)\.valid/);
  assert.match(addressTab, /validatePhoneNumber\(phone\.trim\(\)\)\.valid/);

  assert.match(securityTab, /isGoogleAccount/);
  assert.doesNotMatch(securityTab, /118\.69\.182/);
  assert.doesNotMatch(securityTab, /iPhone 15 Pro/);

  assert.match(appSrc, /<Route path="\/settings" element=\{<RequireCustomer><UserSettingsPage \/><\/RequireCustomer>\}/);
  assert.doesNotMatch(profileModal, /Shopee Standard/i);
});
