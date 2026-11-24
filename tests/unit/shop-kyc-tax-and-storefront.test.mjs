import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateVietnamCCCD,
  validateVietnamTaxCode,
  isValidMst10Checksum,
  compareVietnameseAccountNames,
  evaluateCccdQrConsistency,
} from '../../backend/src/modules/shop/kycRules.ts';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-KYC-01: Tax Code Mod-11 checksum catches made-up 10-digit numbers and accepts valid enterprise/branch/-888/12-digit formats', () => {
  // Real valid Mod-11 Vietnam tax codes (e.g. Vietcombank 0100112437, FPT 0101248141)
  assert.equal(isValidMst10Checksum('0100112437'), true);
  assert.equal(isValidMst10Checksum('0101248141'), true);
  // Fake / sequential / repeated numbers rejected by Mod-11
  assert.equal(isValidMst10Checksum('0123456789'), false);
  assert.equal(isValidMst10Checksum('1111111111'), false);
  assert.equal(isValidMst10Checksum('0101248142'), false); // off by 1 check digit

  assert.equal(validateVietnamTaxCode('0101248141').kind, 'ENTERPRISE_10');
  assert.equal(validateVietnamTaxCode('0101248141-001').kind, 'BRANCH_13');
  assert.equal(validateVietnamTaxCode('0101248141-888').kind, 'ECOMMERCE_888');
  assert.equal(validateVietnamTaxCode('079095001234').kind, 'PERSONAL_CCCD_12');
  assert.equal(validateVietnamTaxCode('079095001234-888').kind, 'ECOMMERCE_888');
  assert.equal(validateVietnamTaxCode('0123456789-888').valid, false);
});

test('TC-KYC-02: CCCD 12-digit validator enforces 63 province codes, adult age >= 18, and rejects bogus strings', () => {
  const hcm = validateVietnamCCCD('079095001234');
  assert.equal(hcm.valid, true);
  assert.equal(hcm.provinceName, 'TP. Hồ Chí Minh');
  assert.equal(hcm.birthYear, 1995);
  assert.equal(hcm.gender, 'MALE');

  const hn = validateVietnamCCCD('001198004321');
  assert.equal(hn.valid, true);
  assert.equal(hn.provinceName, 'Hà Nội');
  assert.equal(hn.birthYear, 1998);
  assert.equal(hn.gender, 'FEMALE');

  assert.equal(validateVietnamCCCD('999095001234').valid, false); // invalid province 999
  assert.equal(validateVietnamCCCD('079220001234').valid, false); // born 2020 -> minor < 18
  assert.equal(validateVietnamCCCD('111111111111').valid, false); // repeated digits
});

test('TC-KYC-03: Bank account holder name comparison and CCCD QR consistency detect mismatches', () => {
  const exact = compareVietnameseAccountNames('NGUYEN VAN AN', 'Nguyễn Văn An');
  assert.equal(exact.matched, true);
  assert.equal(exact.score, 100);

  const mismatch = compareVietnameseAccountNames('TRAN THI BINH', 'Nguyễn Văn An');
  assert.equal(mismatch.matched, false);

  const qrOk = evaluateCccdQrConsistency('079095001234', 'Nguyễn Văn An', {
    cccd: '079095001234',
    fullName: 'NGUYỄN VĂN AN',
  });
  assert.equal(qrOk.status, 'MATCHED');

  const qrBad = evaluateCccdQrConsistency('079095001234', 'Nguyễn Văn An', {
    cccd: '001090009999',
    fullName: 'LÊ VĂN BÌNH',
  });
  assert.equal(qrBad.status, 'MISMATCHED');
});

test('TC-KYC-04: Security guards disable auto-approve in ensureShopForUser and enforce account & status isolation', () => {
  const repoSrc = readRepoFile('backend/src/modules/commerce/commerce.repository.ts');
  const routesSrc = readRepoFile('backend/src/modules/commerce/commerce.routes.ts');
  const ctrlSrc = readRepoFile('backend/src/modules/commerce/commerce.controller.ts');
  const appSrc = readRepoFile('src/App.tsx');

  // Auto-approve backdoor removed
  assert.doesNotMatch(repoSrc, /VALUES \(\$1, \$2, \$3, \$4, 'Việt Nam', \$5, 'APPROVED', TRUE/);
  // Shop product/profile/reply routes require APPROVED shop
  assert.match(routesSrc, /\/shop\/products'.*requireApprovedShop/);
  assert.match(routesSrc, /\/shop\/profile'.*requireApprovedShop/);
  assert.match(routesSrc, /\/stores\/:slug/);
  // Account separation: SHOP_OWNER cannot place personal orders or write reviews
  assert.match(ctrlSrc, /req\.user\.role === 'SHOP_OWNER'/);
  // App redirects authenticated store role away from Home/Dashboard to /shop and exposes /stores/:slug
  assert.match(appSrc, /path="\/stores\/:slug"/);
  assert.match(appSrc, /if \(isAuthenticated && userRole === 'store'\)/);
});

