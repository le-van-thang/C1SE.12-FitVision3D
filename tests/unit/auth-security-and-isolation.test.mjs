import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-AUTH-01: AuthModal resets credential state across close/logout/tab switch and drops 123456 OTP fallback', () => {
  const modalSrc = readRepoFile('src/components/auth/AuthModal.tsx');

  // Effect resets all sensitive fields when modal closes or switches to signin/register/forgot
  assert.match(modalSrc, /const prevTabRef = useRef<string \| null>\(null\);/);
  assert.match(modalSrc, /if \(!isAuthModalOpen\)\s*\{\s*setEmail\(''\);\s*setPassword\(''\);/);
  assert.match(
    modalSrc,
    /if \(authModalTab === 'signin' \|\| authModalTab === 'register' \|\| authModalTab === 'forgot'\)\s*\{\s*setEmail\(''\);\s*setPassword\(''\);/
  );
  // Clears password immediately on successful login & registration
  assert.match(modalSrc, /const res = await signIn\(email, password, websiteTrap\);[\s\S]*if \(res\.success\)\s*\{[\s\S]*setEmail\(''\);[\s\S]*setPassword\(''\);/);
  assert.match(modalSrc, /const res = await register\([\s\S]*if \(res\.success\)\s*\{[\s\S]*setPassword\(''\);[\s\S]*setConfirmPassword\(''\);/);

  // No silent fallback OTP '123456' on verification submit
  assert.doesNotMatch(modalSrc, /verifyEmail\(email,\s*otpCode \|\| ['"]123456['"]\)/);
  assert.match(modalSrc, /if \(cleanOtp\.length !== 6\)/);
});

test('TC-AUTH-02: AuthModal passes Google OAuth mode by tab and preserves AUTH_EMAIL_ALREADY_EXISTS errors', () => {
  const modalSrc = readRepoFile('src/components/auth/AuthModal.tsx');

  assert.match(modalSrc, /mode:\s*authModalTab === 'register' \? 'register' : 'signin'/);
  assert.match(modalSrc, /res\.errorCode === 'AUTH_EMAIL_ALREADY_EXISTS'/);
  assert.match(modalSrc, /lower\.includes\('đã tồn tại'\)/);
});

test('TC-AUTH-03: AuthContext removes fake offline auto-login and exposes errorCode on register/Google', () => {
  const ctxSrc = readRepoFile('src/context/AuthContext.tsx');
  const apiSrc = readRepoFile('src/services/authApi.ts');

  assert.doesNotMatch(ctxSrc, /const offlineProfile:\s*Profile/);
  assert.doesNotMatch(ctxSrc, /Hỗ trợ chế độ Offline khi Backend/);
  assert.match(ctxSrc, /return\s*\{\s*success:\s*false,\s*errorCode:\s*res\.error\?\.code,\s*error:\s*res\.error\?\.message \|\| 'Đăng ký thất bại/);
  assert.match(ctxSrc, /mode\?:\s*'signin' \| 'register'/);
  assert.match(apiSrc, /mode\?:\s*'signin' \| 'register'/);
});

test('TC-AUTH-04: Backend enforces Google register duplicate rejection, Gmail canonical check, DB reconnect, and OWASP timing/enumeration guards', () => {
  const dtoSrc = readRepoFile('backend/src/modules/auth/auth.dto.ts');
  const repoSrc = readRepoFile('backend/src/modules/auth/auth.repository.ts');
  const svcSrc = readRepoFile('backend/src/modules/auth/auth.service.ts');

  assert.match(dtoSrc, /mode:\s*z\.enum\(\['signin',\s*'register'\]\)\.optional\(\)\.default\('signin'\)/);
  assert.match(repoSrc, /export function canonicalizeEmail\(email:\s*string\)/);
  assert.match(repoSrc, /async findUserByEmailOrCanonical\(email:\s*string\)/);
  // isDbAvailable must only short-circuit when dbConnected === true (never permanently cache false)
  assert.match(repoSrc, /if \(dbConnected\) return true;/);

  assert.match(svcSrc, /findUserByEmailOrCanonical\(dto\.email\)/);
  assert.match(svcSrc, /if \(existingAccount && dto\.mode === 'register'\)\s*\{\s*throw new AppError\(\s*409,\s*ErrorCode\.AUTH_EMAIL_ALREADY_EXISTS/);
  assert.match(svcSrc, /if \(!user\)\s*\{\s*try\s*\{\s*await verifyPassword\(/);
  assert.doesNotMatch(svcSrc, /throw new AppError\(404,\s*ErrorCode\.AUTH_UNAUTHORIZED,\s*'Không tìm thấy tài khoản người dùng\.'\)/);
});

