import http from 'http';
import { app } from './src/app.js';
import { authRepository } from './src/modules/auth/auth.repository.js';
import { hashPassword } from './src/utils/password.js';

async function runTests() {
  console.log('🧪 Starting FitVision3D Backend Auth Automated Test Suite...\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1/auth`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const testHeaders = {
    'Content-Type': 'application/json',
    'x-test-suite': 'true',
  };

  // Pre-seed an ACTIVE test user to test Login & Token flows
  const activePasswordHash = await hashPassword('ActivePassword2026@');
  const activeUser = await authRepository.createUser({
    email: 'active_tester@fitvision3d.com',
    passwordHash: activePasswordHash,
    fullName: 'Active QA Engineer',
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  // TEST 1: Register User - Valid
  console.log('[1] Testing Customer Registration (POST /register)...');
  const regRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: testHeaders,
    body: JSON.stringify({
      fullName: 'Nguyễn Văn Test',
      email: 'customer_new@fitvision3d.com',
      password: 'StrongPassword123@',
      confirmPassword: 'StrongPassword123@',
      termsAgreed: true,
      extraNotes: '',
    }),
  });
  const regJson = await regRes.json();
  assert(regRes.status === 201, 'Status is 201 Created');
  assert(regJson.success === true, 'Response envelope success = true');
  assert(regJson.data.status === 'PENDING_VERIFY', 'New user status is PENDING_VERIFY');

  // TEST 1.1: Verify Email via OTP (Mục 3.3 Contract)
  console.log('\n[1.1] Testing Email OTP Verification (POST /verify-email)...');
  const verifyRes = await fetch(`${baseUrl}/verify-email`, {
    method: 'POST',
    headers: testHeaders,
    body: JSON.stringify({
      email: 'customer_new@fitvision3d.com',
      otp: '123456',
    }),
  });
  const verifyJson = await verifyRes.json();
  assert(verifyRes.status === 200, 'Verify email status is 200 OK');
  assert(verifyJson.data.status === 'ACTIVE', 'User successfully activated to ACTIVE');

  // TEST 2: Register User - Honeypot Trigger
  console.log('\n[2] Testing Honeypot Bot Trap (POST /register)...');
  const botRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: testHeaders,
    body: JSON.stringify({
      fullName: 'Bot Scanner',
      email: 'bot_scanner@example.com',
      password: 'StrongPassword123@',
      confirmPassword: 'StrongPassword123@',
      termsAgreed: true,
      extraNotes: 'I am an automated bot',
    }),
  });
  const botJson = await botRes.json();
  assert(botRes.status === 201, 'Silent drop returns 201 fake success');
  assert(botJson.data.userId === 'usr_mock_bot_detected', 'Bot recognized and neutralized');

  // TEST 3: Register User - Disposable Email Filter
  console.log('\n[3] Testing Disposable Email Filter (POST /register)...');
  const spamRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: testHeaders,
    body: JSON.stringify({
      fullName: 'Spam User',
      email: 'spammer@10minutemail.com',
      password: 'StrongPassword123@',
      confirmPassword: 'StrongPassword123@',
      termsAgreed: true,
      extraNotes: '',
    }),
  });
  const spamJson = await spamRes.json();
  assert(spamRes.status === 400, 'Status is 400 Bad Request');
  assert(spamJson.error.code === 'AUTH_DISPOSABLE_EMAIL', 'Error code is AUTH_DISPOSABLE_EMAIL');

  // TEST 4: Register Shop Owner
  console.log('\n[4] Testing Shop Owner Registration (POST /register-shop)...');
  const shopRes = await fetch(`${baseUrl}/register-shop`, {
    method: 'POST',
    headers: testHeaders,
    body: JSON.stringify({
      shopName: 'Atelier Tailor Shop',
      phoneNumber: '0912345678',
      shopAddress: 'Số 45 Lê Duẩn, Quận 1, TP. HCM',
      fullName: 'Chủ Shop Hoàng',
      email: 'shop_owner_01@fitvision3d.com',
      password: 'ShopOwnerPassword2026@',
      confirmPassword: 'ShopOwnerPassword2026@',
      termsAgreed: true,
      extraNotes: '',
    }),
  });
  const shopJson = await shopRes.json();
  assert(shopRes.status === 201, 'Shop registration status is 201 Created');
  assert(shopJson.data.role === 'SHOP_OWNER', 'Role is SHOP_OWNER');
  assert(shopJson.data.status === 'PENDING_APPROVAL', 'Status is PENDING_APPROVAL');

  // TEST 5: Login - Wrong Password
  console.log('\n[5] Testing Login Bad Credentials (POST /login)...');
  const wrongLoginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: testHeaders,
    body: JSON.stringify({
      email: 'active_tester@fitvision3d.com',
      password: 'WrongPassword123@',
    }),
  });
  const wrongLoginJson = await wrongLoginRes.json();
  assert(wrongLoginRes.status === 401, 'Status is 401 Unauthorized');
  assert(wrongLoginJson.error.code === 'AUTH_INVALID_CREDENTIALS', 'Error code is AUTH_INVALID_CREDENTIALS');

  // TEST 6: Login - Active User Success & Cookie Inspection
  console.log('\n[6] Testing Login Success & HttpOnly Cookie (POST /login)...');
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: testHeaders,
    body: JSON.stringify({
      email: 'active_tester@fitvision3d.com',
      password: 'ActivePassword2026@',
      rememberMe: true,
    }),
  });
  const loginJson = await loginRes.json();
  assert(loginRes.status === 200, 'Login status is 200 OK');
  assert(Boolean(loginJson.data.accessToken), 'Access Token received in JSON body');
  assert(loginJson.data.user.role === 'ADMIN', 'User role is ADMIN');

  const setCookie = loginRes.headers.get('set-cookie');
  assert(Boolean(setCookie && setCookie.includes('refreshToken=')), 'Set-Cookie contains refreshToken');
  assert(Boolean(setCookie && setCookie.includes('HttpOnly')), 'Cookie has HttpOnly flag');
  assert(Boolean(setCookie && setCookie.includes('SameSite=Lax')), 'Cookie has SameSite=Lax flag');

  const accessToken = loginJson.data.accessToken;
  const rawCookie = setCookie.split(';')[0]; // refreshToken=...

  // TEST 7: Protected API - GET /auth/me
  console.log('\n[7] Testing Protected Profile API (GET /me)...');
  const meRes = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meJson = await meRes.json();
  assert(meRes.status === 200, 'GET /me returns 200 OK');
  assert(meJson.data.email === 'active_tester@fitvision3d.com', 'Profile matches authenticated user');

  // TEST 8: Refresh Token Rotation
  console.log('\n[8] Testing Refresh Token Rotation (POST /refresh-token)...');
  const refreshRes = await fetch(`${baseUrl}/refresh-token`, {
    method: 'POST',
    headers: { Cookie: rawCookie },
  });
  const refreshJson = await refreshRes.json();
  assert(refreshRes.status === 200, 'Refresh Token returns 200 OK');
  assert(Boolean(refreshJson.data.accessToken), 'New Access Token received');
  
  const newSetCookie = refreshRes.headers.get('set-cookie');
  assert(Boolean(newSetCookie && newSetCookie !== setCookie), 'New Refresh Token cookie rotated');

  // TEST 9: Replay Attack Defense (Using old revoked cookie)
  console.log('\n[9] Testing Replay Attack Detection with old token...');
  const replayRes = await fetch(`${baseUrl}/refresh-token`, {
    method: 'POST',
    headers: { Cookie: rawCookie }, // Old revoked token
  });
  assert(replayRes.status === 401, 'Replay attack blocked with 401 Unauthorized');

  // TEST 10: Logout
  console.log('\n[10] Testing Logout (POST /logout)...');
  const logoutRes = await fetch(`${baseUrl}/logout`, {
    method: 'POST',
    headers: { Cookie: newSetCookie.split(';')[0] },
  });
  const logoutSetCookie = logoutRes.headers.get('set-cookie');
  assert(logoutRes.status === 200, 'Logout status is 200 OK');
  const isCleared = logoutSetCookie && (logoutSetCookie.includes('Max-Age=0') || logoutSetCookie.includes('1970'));
  assert(Boolean(isCleared), 'Cookie expired & cleared on logout');

  // TEST 11: Rate Limiter Live Inspection (Without test bypass)
  console.log('\n[11] Testing Rate Limiting on Registration...');
  let rateLimitHit = false;
  for (let i = 0; i < 5; i++) {
    const rlRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // No bypass
      body: JSON.stringify({
        fullName: 'Rapid User',
        email: `rapid_${i}_${Date.now()}@fitvision3d.com`,
        password: 'Password123@',
        confirmPassword: 'Password123@',
        termsAgreed: true,
      }),
    });
    if (rlRes.status === 429) {
      rateLimitHit = true;
      break;
    }
  }
  assert(rateLimitHit === true, 'Rate limiter blocks rapid registration attempts with HTTP 429');

  server.close();
  console.log(`\n==================================================`);
  console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
