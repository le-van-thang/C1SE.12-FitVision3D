import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-SEC-W2-01: Auth enforces LOCKED blocking across login, refreshToken, googleLogin and revokes tokens', () => {
  const authServiceSrc = readRepoFile('backend/src/modules/auth/auth.service.ts');
  const authRepoSrc = readRepoFile('backend/src/modules/auth/auth.repository.ts');

  // login, refreshToken, and googleLogin must all explicitly block LOCKED accounts
  const lockedMatches = authServiceSrc.match(/user\.status === 'LOCKED'/g) || [];
  assert.equal(lockedMatches.length, 3, 'Expected LOCKED check in login, refreshToken, and googleLogin');
  assert.match(authServiceSrc, /ErrorCode\.AUTH_ACCOUNT_LOCKED/);

  // authRepository exposes token revocation by user_id
  assert.match(authRepoSrc, /async revokeUserTokens\(userId:\s*string\)/);
  assert.match(authRepoSrc, /UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = \$1/);
});

test('TC-SEC-W2-02: Admin RBAC validates enums, blocks self/last-admin lockout & demotion, revokes tokens, and preserves ADMIN in approveShop', () => {
  const adminServiceSrc = readRepoFile('backend/src/modules/admin/admin.service.ts');
  const adminRepoSrc = readRepoFile('backend/src/modules/admin/admin.repository.ts');

  // Enum validation
  assert.match(adminServiceSrc, /new Set\(\['ACTIVE', 'LOCKED', 'BANNED', 'PENDING_APPROVAL'\]\)/);
  assert.match(adminServiceSrc, /new Set\(\['USER', 'SHOP_OWNER', 'ADMIN'\]\)/);

  // Self-lockout & self-demotion protection
  assert.match(adminServiceSrc, /adminUserId && target\.id === adminUserId && isRestrictedStatus/);
  assert.match(adminServiceSrc, /adminUserId && target\.id === adminUserId && normalizedRole !== 'ADMIN'/);

  // Last active admin protection
  assert.match(adminServiceSrc, /activeAdminsCount <= 1/);

  // Refresh token revocation on LOCKED / BANNED
  assert.match(adminServiceSrc, /await adminRepository\.revokeUserRefreshTokens\(userId\)/);
  assert.match(adminRepoSrc, /async revokeUserRefreshTokens\(userId:\s*string\)/);

  // approveShop & provisionShopForUser preserve ADMIN role
  const preserveAdminMatches =
    adminRepoSrc.match(/role = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'SHOP_OWNER' END/g) || [];
  assert.ok(preserveAdminMatches.length >= 2, 'Expected ADMIN preservation in approveShop and PROMOTE_CURRENT');
});

test('TC-SEC-W2-03: Shop KYC routes, applyShop status/duplicate/slug guards, pepper config, password preservation, and modal cleanup', () => {
  const routesSrc = readRepoFile('backend/src/modules/admin/admin.routes.ts');
  const adminRepoSrc = readRepoFile('backend/src/modules/admin/admin.repository.ts');
  const envSrc = readRepoFile('backend/src/config/env.ts');
  const envExampleSrc = readRepoFile('backend/.env.example');
  const kycSrc = readRepoFile('backend/src/modules/shop/kycVerification.ts');
  const modalSrc = readRepoFile('src/components/store/MerchantOnboardingModal.tsx');

  // Routes: tax-lookup throttled; stores/apply & resubmit require SHOP_OWNER or ADMIN
  assert.match(routesSrc, /\/tax-lookup\/:taxCode',\s*taxLookupRateLimiter,/);
  assert.match(routesSrc, /\/stores\/apply',\s*requireAuth,\s*requireRole\('SHOP_OWNER', 'ADMIN'\)/);
  assert.match(routesSrc, /\/stores\/my-shop\/resubmit',\s*requireAuth,\s*requireRole\('SHOP_OWNER', 'ADMIN'\)/);

  // applyShop guards SUSPENDED / APPROVED, duplicate checks, and brand_slug insert
  assert.match(adminRepoSrc, /if \(current\.status === 'SUSPENDED'\)/);
  assert.match(adminRepoSrc, /if \(current\.status === 'APPROVED'\)/);
  assert.match(adminRepoSrc, /LOWER\(shop_name\) = LOWER\(\$1\) AND owner_id <> \$2/);
  assert.match(adminRepoSrc, /tax_code = \$1 AND owner_id <> \$2/);
  assert.match(adminRepoSrc, /national_id_hash = \$1 AND owner_id <> \$2/);
  assert.match(adminRepoSrc, /INSERT INTO shops \(\s*owner_id, shop_name, brand_slug,/);

  // PROMOTE_CURRENT without temporaryPassword does not overwrite password_hash
  assert.match(adminRepoSrc, /\} else if \(providedPassword\) \{[\s\S]*\} else \{[\s\S]*UPDATE users[\s\S]*SET role = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'SHOP_OWNER' END,\s*status = \$2,\s*updated_at = NOW\(\)/);

  // Dedicated KYC_HASH_PEPPER configured
  assert.match(envSrc, /KYC_HASH_PEPPER:/);
  assert.match(envExampleSrc, /^KYC_HASH_PEPPER=/m);
  assert.match(kycSrc, /env\.KYC_HASH_PEPPER/);
  assert.doesNotMatch(kycSrc, /JWT_ACCESS_SECRET\.slice/);

  // MerchantOnboardingModal wipes sensitive state on close
  assert.match(modalSrc, /setNationalId\(''\)/);
  assert.match(modalSrc, /setBankAccountNumber\(''\)/);
  assert.match(modalSrc, /setPassword\(''\)/);
  assert.match(modalSrc, /setCccdFrontUrl\(''\)/);
});
