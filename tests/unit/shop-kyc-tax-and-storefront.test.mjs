import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-SHOP-01: Deprecated KYC, entity_type, Tax Code, CCCD and Bank tables/modules are cleanly removed', () => {
  assert.equal(fs.existsSync(path.join(REPO_ROOT, 'backend/src/modules/shop/kycRules.ts')), false);
  assert.equal(fs.existsSync(path.join(REPO_ROOT, 'backend/src/modules/shop/kycVerification.ts')), false);
  assert.equal(fs.existsSync(path.join(REPO_ROOT, 'src/utils/shopKycValidation.ts')), false);

  const onboardingSrc = readRepoFile('src/components/store/MerchantOnboardingModal.tsx');
  const shopPortalSrc = readRepoFile('src/pages/ShopPortal.tsx');
  const adminPortalSrc = readRepoFile('src/pages/AdminPortal.tsx');
  const authDtoSrc = readRepoFile('backend/src/modules/auth/auth.dto.ts');

  assert.doesNotMatch(onboardingSrc, /entity_type|entityType|taxCode|nationalId|bankAccountNumber/);
  assert.doesNotMatch(shopPortalSrc, /shopKycValidation|VIETNAM_BANKS|resubmitEntityType|resubmitNationalId/);
  assert.doesNotMatch(adminPortalSrc, /provEntityType|provTaxCode|handleQuickTaxLookup/);
  assert.doesNotMatch(authDtoSrc, /entity_type|tax_code|national_id|bank_account/);

  assert.match(onboardingSrc, /paypalPayoutEmail/);
  assert.match(shopPortalSrc, /updateShopPayPalAccount/);
  assert.match(shopPortalSrc, /getShopPayouts/);
  assert.match(adminPortalSrc, /getAdminPayouts/);
  assert.match(adminPortalSrc, /disburseAdminPayouts/);
});

test('TC-SHOP-02: Marketplace PayPal config, Escrow breakdown, and 4 disbursement eligibility guards exist on Backend & Frontend', () => {
  const repoSrc = readRepoFile('backend/src/modules/commerce/commerce.repository.ts');
  const bootstrapSrc = readRepoFile('backend/src/modules/commerce/commerce.bootstrap.ts');
  const routesSrc = readRepoFile('backend/src/modules/commerce/commerce.routes.ts');
  const ctrlSrc = readRepoFile('backend/src/modules/commerce/commerce.controller.ts');
  const appSrc = readRepoFile('src/App.tsx');

  // Auto-approve backdoor does not exist; 3 active sample shops are seeded cleanly with paypal_payout_email
  assert.doesNotMatch(repoSrc, /VALUES \(\$1, \$2, \$3, \$4, 'Việt Nam', \$5, 'APPROVED', TRUE/);
  assert.match(bootstrapSrc, /shop1\.milan@fitvision3d\.com/);
  assert.match(bootstrapSrc, /shop2\.nordic@fitvision3d\.com/);
  assert.match(bootstrapSrc, /shop@fitvision3d\.com/);
  assert.match(bootstrapSrc, /CREATE TABLE IF NOT EXISTS shop_payouts/);

  // PayPal breakdown & 4-condition eligibility checks
  assert.match(repoSrc, /export function computeOrderPayoutBreakdown\(/);
  assert.match(repoSrc, /export function evaluateOrderPayoutEligibility\(/);
  assert.match(repoSrc, /order\.payment_status !== 'paid'/);
  assert.match(repoSrc, /order\.status !== 'completed'/);
  assert.match(repoSrc, /paypal_payout_email/);
  assert.match(repoSrc, /safeHoldDays > 0 && Date\.now\(\) < eligibleMs/);

  // RBAC & Approved Shop routes
  assert.match(routesSrc, /\/shop\/products'.*requireApprovedShop/);
  assert.match(routesSrc, /\/shop\/paypal-account'.*requireApprovedShop/);
  assert.match(routesSrc, /\/admin\/payouts'.*requireRole\('ADMIN'\)/);
  assert.match(routesSrc, /\/stores\/:slug/);
  assert.match(ctrlSrc, /req\.user\.role === 'SHOP_OWNER'/);

  // Storefront & Admin provision route contracts
  assert.match(appSrc, /path="\/stores\/:slug"/);
  assert.match(appSrc, /if \(isAuthenticated && userRole === 'store'\)/);

  const adminRoutesSrc = readRepoFile('backend/src/modules/admin/admin.routes.ts');
  const adminPortalSrc = readRepoFile('src/pages/AdminPortal.tsx');
  assert.match(adminRoutesSrc, /\/users\/:id\/provision-shop'.*requireRole\('ADMIN'\)/);
  assert.match(adminPortalSrc, /openProvisionShopModal/);
});
