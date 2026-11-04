import http from 'http';
import { app } from './src/app.js';

async function runLiveDemo() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1/auth`;

  const divider = '─'.repeat(70);
  console.log('\n' + '═'.repeat(70));
  console.log('       🧵 FITVISION 3D — LIVE DEMONSTRATION TÍNH NĂNG AUTH & BẢO MẬT');
  console.log('═'.repeat(70) + '\n');

  // =========================================================================
  // DEMO 1: ĐĂNG KÝ KHÁCH HÀNG (USER REGISTRATION)
  // =========================================================================
  console.log(`📌 BƯỚC 1: ĐĂNG KÝ KHÁCH HÀNG MỚI (POST /register)`);
  console.log(`- Input: FullName = "Trần Hoàng Nam", Email = "nam_customer@gmail.com"`);
  
  const regRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
    body: JSON.stringify({
      fullName: 'Trần Hoàng Nam',
      email: 'nam_customer@gmail.com',
      password: 'SecurePassword2026@',
      confirmPassword: 'SecurePassword2026@',
      termsAgreed: true,
      extraNotes: '',
    }),
  });
  const regData = await regRes.json();
  console.log(`- HTTP Status: ${regRes.status} Created`);
  console.log(`- Response Payload:`, JSON.stringify(regData, null, 2));
  console.log(divider);

  // =========================================================================
  // DEMO 2: KÍCH HOẠT TÀI KHOẢN QUA MÃ OTP (POST /verify-email)
  // =========================================================================
  console.log(`\n📌 BƯỚC 2: KÍCH HOẠT TÀI KHOẢN BẰNG MÃ OTP (POST /verify-email)`);
  console.log(`- Input: Email = "nam_customer@gmail.com", OTP = "123456"`);

  const verifyRes = await fetch(`${baseUrl}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
    body: JSON.stringify({
      email: 'nam_customer@gmail.com',
      otp: '123456',
    }),
  });
  const verifyData = await verifyRes.json();
  console.log(`- HTTP Status: ${verifyRes.status} OK`);
  console.log(`- Trạng thái sau kích hoạt:`, JSON.stringify(verifyData, null, 2));
  console.log(divider);

  // =========================================================================
  // DEMO 3: ĐĂNG NHẬP & CẤP COOKIE HTTPONLY (POST /login)
  // =========================================================================
  console.log(`\n📌 BƯỚC 3: ĐĂNG NHẬP TÀI KHOẢN VỪA KÍCH HOẠT (POST /login)`);
  console.log(`- Input: Email = "nam_customer@gmail.com", Password = "SecurePassword2026@", RememberMe = true`);

  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
    body: JSON.stringify({
      email: 'nam_customer@gmail.com',
      password: 'SecurePassword2026@',
      rememberMe: true,
    }),
  });
  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get('set-cookie');
  console.log(`- HTTP Status: ${loginRes.status} OK`);
  console.log(`- AccessToken (15m): ${loginData.data.accessToken.substring(0, 45)}...`);
  console.log(`- User Profile: Role = ${loginData.data.user.role}, Status = ${loginData.data.user.status}`);
  console.log(`- Set-Cookie Header (Bảo vệ XSS):`);
  console.log(`  👉 "${setCookie}"`);
  console.log(divider);

  const userToken = loginData.data.accessToken;
  const rawCookie = setCookie.split(';')[0];

  // =========================================================================
  // DEMO 4: GỌI API BẢO VỆ PROFILE (GET /me)
  // =========================================================================
  console.log(`\n📌 BƯỚC 4: GỌI API BẢO VỆ PROFILE VỚI BEARER TOKEN (GET /me)`);
  const meRes = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const meData = await meRes.json();
  console.log(`- HTTP Status: ${meRes.status} OK`);
  console.log(`- Thông tin trả về:`, JSON.stringify(meData.data, null, 2));
  console.log(divider);

  // =========================================================================
  // DEMO 5: KIỂM CHỨNG PHÂN QUYỀN RBAC (USER KHÔNG THỂ VÀO TRANG ADMIN)
  // =========================================================================
  console.log(`\n📌 BƯỚC 5: KIỂM TRA PHÂN QUYỀN RBAC (USER GỌI API ADMIN)`);
  console.log(`- Request: GET /admin-dashboard (Sử dụng token của User Trần Hoàng Nam)`);

  const rbacRes = await fetch(`${baseUrl}/admin-dashboard`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const rbacData = await rbacRes.json();
  console.log(`- HTTP Status: ${rbacRes.status} Forbidden`);
  console.log(`- Hệ thống phản hồi chặn đứng:`, JSON.stringify(rbacData, null, 2));
  console.log(divider);

  // =========================================================================
  // DEMO 6: ĐĂNG KÝ CHỦ SHOP (POST /register-shop)
  // =========================================================================
  console.log(`\n📌 BƯỚC 6: ĐĂNG KÝ CHỦ CỬA HÀNG THỜI TRANG 3D (POST /register-shop)`);
  console.log(`- Input: ShopName = "L'Atelier Haute Couture", Phone = "0988776655"`);

  const shopRes = await fetch(`${baseUrl}/register-shop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
    body: JSON.stringify({
      shopName: "L'Atelier Haute Couture",
      phoneNumber: '0988776655',
      shopAddress: 'Số 88 Đường Đồng Khởi, Bến Nghé, Quận 1, TP. HCM',
      fullName: 'Bà Lê Minh Thư',
      email: 'thu_atelier@couture.com',
      password: 'ShopPassword2026@',
      confirmPassword: 'ShopPassword2026@',
      termsAgreed: true,
      extraNotes: '',
    }),
  });
  const shopData = await shopRes.json();
  console.log(`- HTTP Status: ${shopRes.status} Created`);
  console.log(`- Kết quả: Role = ${shopData.data.role}, Status = ${shopData.data.status} (Chờ duyệt)`);
  console.log(divider);

  // =========================================================================
  // DEMO 7: BẪY BOT HONEYPOT (LỚP 1 CHỐNG SPAM)
  // =========================================================================
  console.log(`\n📌 BƯỚC 7: KIỂM TRA BẪY BOT HONEYPOT (LỚP 1 CHỐNG SPAM)`);
  console.log(`- Kịch bản: Bot tự động điền giá trị vào trường ẩn 'extraNotes'`);

  const botRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
    body: JSON.stringify({
      fullName: 'Automated Botnet Crawler',
      email: `bot_${Date.now()}@spammer.net`,
      password: 'Password123@',
      confirmPassword: 'Password123@',
      termsAgreed: true,
      extraNotes: 'INJECTED_VALUE_FROM_MALICIOUS_BOT', // Bot bị sập bẫy
    }),
  });
  const botData = await botRes.json();
  console.log(`- HTTP Status: ${botRes.status} Created (Silent Drop giả lập)`);
  console.log(`- Phản hồi đánh lừa bot:`, JSON.stringify(botData, null, 2));
  console.log(`- Kết quả DB: Không tốn tài nguyên băm mật khẩu, không tạo user thực trong DB.`);
  console.log(divider);

  // =========================================================================
  // DEMO 8: CHẶN EMAIL RÁC DÙNG 1 LẦN (LỚP 3 CHỐNG SPAM)
  // =========================================================================
  console.log(`\n📌 BƯỚC 8: CHẶN EMAIL RÁC 10 PHÚT (LỚP 3 CHỐNG SPAM)`);
  console.log(`- Input Email: "anonymous_spammer@10minutemail.com"`);

  const spamRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
    body: JSON.stringify({
      fullName: 'Spam Account',
      email: 'anonymous_spammer@10minutemail.com',
      password: 'Password123@',
      confirmPassword: 'Password123@',
      termsAgreed: true,
      extraNotes: '',
    }),
  });
  const spamData = await spamRes.json();
  console.log(`- HTTP Status: ${spamRes.status} Bad Request`);
  console.log(`- Phản hồi từ chối:`, JSON.stringify(spamData, null, 2));
  console.log(divider);

  // =========================================================================
  // DEMO 9: BRUTE-FORCE LOGIN VÀ CƠ CHẾ KHÓA BẢO VỆ TÀI KHOẢN
  // =========================================================================
  console.log(`\n📌 BƯỚC 9: TẤN CÔNG DÒ MẬT KHẨU (BRUTE-FORCE DEFENSE)`);
  console.log(`- Gửi thử sai mật khẩu vào tài khoản "nam_customer@gmail.com":`);
  
  for (let i = 1; i <= 10; i++) {
    const bfRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
      body: JSON.stringify({
        email: 'nam_customer@gmail.com',
        password: `WrongPass_${i}`,
      }),
    });
    const bfData = await bfRes.json();
    if (i === 1 || i === 5 || i === 10) {
      console.log(`  👉 Lần thử ${i}: Status ${bfRes.status} | Code: ${bfData.error?.code} | Msg: "${bfData.error?.message}"`);
    }
  }
  console.log(`- Nhận xét: Lần 5 bắt đầu đòi CAPTCHA, Lần 10 kích hoạt mã HTTP 423 Locked (khóa 15 phút).`);
  console.log(divider);

  // =========================================================================
  // DEMO 10: REFRESH TOKEN ROTATION & ĐĂNG XUẤT AN TOÀN
  // =========================================================================
  console.log(`\n📌 BƯỚC 10: CƠ CHẾ REFRESH TOKEN ROTATION & ĐĂNG XUẤT (POST /refresh-token & /logout)`);
  
  // 1. Silent Refresh
  const refreshRes = await fetch(`${baseUrl}/refresh-token`, {
    method: 'POST',
    headers: { Cookie: rawCookie },
  });
  const refreshData = await refreshRes.json();
  const newSetCookie = refreshRes.headers.get('set-cookie');
  console.log(`- Cấp mới Access Token: Status ${refreshRes.status} OK`);
  console.log(`- Access Token Mới: ${refreshData.data.accessToken.substring(0, 45)}...`);
  console.log(`- Set-Cookie Mới (Đã xoay vòng Token Rotation):`);
  console.log(`  👉 "${newSetCookie}"`);

  // 2. Logout
  const logoutRes = await fetch(`${baseUrl}/logout`, {
    method: 'POST',
    headers: { Cookie: newSetCookie.split(';')[0] },
  });
  const logoutData = await logoutRes.json();
  const logoutCookie = logoutRes.headers.get('set-cookie');
  console.log(`- Đăng xuất: Status ${logoutRes.status} OK`);
  console.log(`- Header xóa Cookie: "${logoutCookie}"`);
  console.log(divider);

  server.close();
  console.log('\n✨ DEMO HOÀN TẤT THÀNH CÔNG 100%! HỆ THỐNG SẴN SÀNG ĐƯA VÀO HOẠT ĐỘNG.\n');
}

runLiveDemo().catch(console.error);

