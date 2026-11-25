import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-ADM-W2-01: Product moderation enforces hidden_by_admin lock against non-admin unhide and validates sale_price < price', () => {
  const bootstrapSrc = readRepoFile('backend/src/modules/commerce/commerce.bootstrap.ts');
  const repoSrc = readRepoFile('backend/src/modules/commerce/commerce.repository.ts');
  const ctrlSrc = readRepoFile('backend/src/modules/commerce/commerce.controller.ts');

  // Schema adds hidden_by_admin
  assert.match(bootstrapSrc, /ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden_by_admin BOOLEAN NOT NULL DEFAULT FALSE/);

  // moderateProduct sets hidden_by_admin and validates sale_price < existing.price
  assert.match(repoSrc, /hidden_by_admin = COALESCE\(\$2, hidden_by_admin\)/);
  assert.match(repoSrc, /parsedSale >= Number\(existing\.price\)/);
  assert.match(repoSrc, /async isProductHiddenByAdmin\(productId:\s*string\)/);

  // updateShopProduct blocks non-admin unhide with 403 when hidden_by_admin is true
  assert.match(ctrlSrc, /!isAdmin && req\.body\?\.isHidden === false/);
  assert.match(ctrlSrc, /await commerceRepository\.isProductHiddenByAdmin\(id\)/);
  assert.match(ctrlSrc, /ErrorCode\.FORBIDDEN_INSUFFICIENT_PERMISSIONS/);
});

test('TC-ADM-W2-02: Voucher creation validates code/NaN/percent<=100 in backend and AdminOperationsTabs awaits DB persistence', () => {
  const ctrlSrc = readRepoFile('backend/src/modules/commerce/commerce.controller.ts');
  const opsSrc = readRepoFile('src/components/admin/AdminOperationsTabs.tsx');

  // Backend voucher creation validation
  assert.match(ctrlSrc, /cleanCode\.length < 3 \|\| !Number\.isFinite\(discountValue\) \|\| discountValue <= 0/);
  assert.match(ctrlSrc, /discountType === 'percent' && discountValue > 100/);

  // UI checks res.success before mutating local state and persists reset settings to DB
  assert.match(opsSrc, /const res = await commerceApi\.moderateProduct\(prodId,\s*\{ isHidden: nextIsHidden \}\);\s*if \(!res\.success\)/);
  assert.match(opsSrc, /const res = await commerceApi\.createVoucher\(created\);\s*if \(!res\.success\)/);
  assert.match(opsSrc, /parsed >= Number\(targetProd\.price\)/);
  assert.match(opsSrc, /const reset = resetPlatformConfig\(\);\s*const res = await commerceApi\.saveSettings/);
});

test('TC-ADM-W2-03: AdminPortal refetches orders on refresh, labels PENDING_APPROVAL accurately, and backend logs real audit durations', () => {
  const adminPortalSrc = readRepoFile('src/pages/AdminPortal.tsx');
  const adminSvcSrc = readRepoFile('backend/src/modules/admin/admin.service.ts');
  const ctrlSrc = readRepoFile('backend/src/modules/commerce/commerce.controller.ts');

  // AdminPortal refetches orders alongside admin data and displays PENDING_APPROVAL cleanly
  assert.match(adminPortalSrc, /const \{ orders, refreshOrders, updateOrderStatus \} = useOrders\(\);/);
  assert.match(adminPortalSrc, /refreshOrders\(\),/);
  assert.match(adminPortalSrc, /user\.status === 'PENDING_APPROVAL'/);
  assert.match(adminPortalSrc, /Chờ duyệt Shop/);

  // Real measured executionTimeMs and commerce audit trail events
  assert.doesNotMatch(adminSvcSrc, /executionTimeMs:\s*(?:12|15|10)\b/);
  assert.match(adminSvcSrc, /executionTimeMs:\s*Math\.max\(1,\s*Date\.now\(\) - startedAt\)/);
  assert.match(ctrlSrc, /actionType:\s*'CMS_SETTINGS_UPDATED'/);
  assert.match(ctrlSrc, /actionType:\s*`VOUCHER_CREATED:\$\{cleanCode\}`/);
  assert.match(ctrlSrc, /actionType:\s*`PRODUCT_MODERATED:\$\{String\(id\)\.slice\(0,\s*16\)\}`/);
});
