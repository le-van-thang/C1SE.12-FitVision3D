import { emailService } from '../../services/email.service.js';
import crypto from 'crypto';
import { authRepository, UserEntity } from './auth.repository.js';
import {
  RegisterDtoType,
  RegisterShopDtoType,
  LoginDtoType,
  ResetPasswordDtoType,
  GoogleAuthDtoType,
} from './auth.dto.js';
import { AppError } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';
import {
  isDisposableEmail,
  validateEmailDomainAndGmailPolicy,
} from '../../constants/disposableEmails.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
} from '../../utils/jwt.js';

export const authService = {
  /**
   * Đăng ký Khách Hàng (USER)
   */
  async registerUser(dto: RegisterDtoType) {
    // 1. Kiểm tra Bẫy Bot Honeypot (Lớp 1 chống spam)
    if (dto.extraNotes && dto.extraNotes.trim() !== '') {
      // Silent Drop: Trả về thành công giả lập để đánh lừa bot
      return {
        userId: 'usr_mock_bot_detected',
        email: dto.email,
        status: 'PENDING_VERIFY' as const,
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.',
      };
    }

    // 2. Kiểm tra Disposable Email & Chuẩn Tên Miền / Gmail Policy
    if (isDisposableEmail(dto.email)) {
      throw new AppError(
        400,
        ErrorCode.AUTH_DISPOSABLE_EMAIL,
        'Hệ thống không chấp nhận email tạm thời/email rác. Vui lòng dùng email chính thức.'
      );
    }

    const emailPolicy = validateEmailDomainAndGmailPolicy(dto.email);
    if (!emailPolicy.valid) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_FAILED,
        emailPolicy.message || 'Email không đúng định dạng hợp lệ.'
      );
    }

    // 3. Kiểm tra Trùng lặp Email
    const existing = await authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new AppError(
        409,
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
        'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng Quên mật khẩu.'
      );
    }

    // 4. Hash mật khẩu (Bcrypt cost >= 12)
    const passwordHash = await hashPassword(dto.password);

    // 5. Gán cứng role = 'USER', status = 'PENDING_VERIFY' (Rule 03)
    const user = await authRepository.createUser({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: 'USER',
      status: 'PENDING_VERIFY',
    });

    // Sinh mã ngẫu nhiên 6 chữ số và gửi qua Gmail SMTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    emailService.saveOtp(user.email, otpCode, 'VERIFY');
    emailService.sendActivationEmail(user.email, user.full_name, otpCode).catch((err) => {
      console.error('Failed to dispatch activation email:', err.message);
    });

    return {
      userId: user.id,
      email: user.email,
      status: user.status,
      message: 'Đăng ký thành công. Mã OTP 6 số đã được gửi tới hộp thư Gmail của bạn.',
      devOtp: otpCode,
    };
  },

  /**
   * Đăng ký Chủ Shop (SHOP_OWNER)
   */
  async registerShop(dto: RegisterShopDtoType) {
    // 1. Honeypot check
    if (dto.extraNotes && dto.extraNotes.trim() !== '') {
      return {
        userId: 'usr_mock_bot_detected',
        email: dto.email,
        role: 'SHOP_OWNER' as const,
        status: 'PENDING_APPROVAL' as const,
        message: 'Đăng ký thành công! Hồ sơ cửa hàng đang chờ quản trị viên xét duyệt.',
      };
    }

    // 2. Disposable Email & Domain Policy check
    if (isDisposableEmail(dto.email)) {
      throw new AppError(
        400,
        ErrorCode.AUTH_DISPOSABLE_EMAIL,
        'Hệ thống không chấp nhận email tạm thời. Vui lòng dùng email chính thức.'
      );
    }

    const emailPolicy = validateEmailDomainAndGmailPolicy(dto.email);
    if (!emailPolicy.valid) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_FAILED,
        emailPolicy.message || 'Email không đúng định dạng hợp lệ.'
      );
    }

    // 3. Email duplication check
    const existing = await authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new AppError(
        409,
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
        'Email này đã được sử dụng. Vui lòng đăng nhập hoặc liên hệ hỗ trợ.'
      );
    }

    // 4. Hash password
    const passwordHash = await hashPassword(dto.password);

    // 5. Tạo user với role = 'SHOP_OWNER', status = 'PENDING_APPROVAL'
    const user = await authRepository.createUser({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: 'SHOP_OWNER',
      status: 'PENDING_APPROVAL',
    });

    // 6. Tạo hồ sơ cửa hàng liên kết 1-1
    await authRepository.createShop({
      ownerId: user.id,
      shopName: dto.shopName,
      phoneNumber: dto.phoneNumber,
      shopAddress: dto.shopAddress,
      taxCode: dto.taxCode,
    });

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      message: 'Đăng ký thành công! Hồ sơ cửa hàng đang chờ quản trị viên xét duyệt.',
    };
  },

  /**
   * Đăng nhập (Login)
   */
  async login(dto: LoginDtoType) {
    const user = await authRepository.findUserByEmail(dto.email);

    // Chống Account Enumeration: Nếu không tìm thấy user, vẫn trả về thông báo chung
    if (!user) {
      throw new AppError(
        401,
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Email hoặc mật khẩu không chính xác.'
      );
    }

    // Kiểm tra trạng thái khóa tạm thời do brute-force (10 lần)
    const now = new Date();
    if (user.lockout_until && new Date(user.lockout_until) > now) {
      throw new AppError(
        423,
        ErrorCode.AUTH_ACCOUNT_LOCKED,
        'Bạn đã thử sai quá nhiều lần. Tài khoản bị tạm khóa 15 phút để bảo vệ.'
      );
    }

    // So khớp mật khẩu
    let isMatch = await verifyPassword(dto.password, user.password_hash);
    if (!isMatch && dto.password.includes('$')) {
      // Hỗ trợ trường hợp Google Autofill lưu dấu $ thay vì chữ S
      const altPass = dto.password.replace(/\$/g, 'S');
      isMatch = await verifyPassword(altPass, user.password_hash);
    } else if (!isMatch && dto.password.includes('S')) {
      const altPass = dto.password.replace(/S/g, '$');
      isMatch = await verifyPassword(altPass, user.password_hash);
    }
    if (!isMatch) {
      const attempts = await authRepository.incrementFailedLogin(user.id);

      if (attempts >= 10) {
        await authRepository.lockUser(user.id, 15);
        throw new AppError(
          423,
          ErrorCode.AUTH_ACCOUNT_LOCKED,
          'Bạn đã thử sai 10 lần liên tiếp. Tài khoản đã bị khóa tạm thời trong 15 phút.'
        );
      }

      if (attempts >= 5) {
        throw new AppError(
          400,
          ErrorCode.AUTH_CAPTCHA_REQUIRED,
          'Bạn đã nhập sai nhiều lần. Vui lòng xác thực CAPTCHA để tiếp tục.'
        );
      }

      throw new AppError(
        401,
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Email hoặc mật khẩu không chính xác.'
      );
    }

    // Đăng nhập thành công: Reset số lần thử sai
    await authRepository.resetLoginAttempts(user.id);

    // Kiểm tra trạng thái tài khoản
    if (user.status === 'PENDING_VERIFY') {
      throw new AppError(
        403,
        ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
        'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email của bạn để xác thực.'
      );
    }

    if (user.status === 'PENDING_APPROVAL') {
      throw new AppError(
        403,
        ErrorCode.AUTH_SHOP_PENDING_APPROVAL,
        'Hồ sơ cửa hàng của bạn đang được xét duyệt. Chúng tôi sẽ thông báo khi hoàn tất.'
      );
    }

    if (user.status === 'BANNED') {
      throw new AppError(
        403,
        ErrorCode.AUTH_ACCOUNT_BANNED,
        'Tài khoản đã bị đình chỉ do vi phạm quy định. Vui lòng liên hệ bộ phận hỗ trợ.'
      );
    }

    // Yêu cầu xác thực 2 lớp (2FA Email OTP) riêng cho tài khoản ADMIN
    if (user.role === 'ADMIN') {
      const providedOtp = (dto.adminOtp || '').trim();
      if (!providedOtp) {
        const otpCode = crypto.randomInt(100000, 999999).toString();
        emailService.saveOtp(user.email, otpCode, 'ADMIN_2FA');
        emailService.sendAdminTwoFactorEmail(user.email, user.full_name, otpCode).catch(console.error);
        console.log(`🔐 [Admin 2FA] Sent 6-digit OTP to ${user.email}: ${otpCode}`);
        return {
          requiresAdmin2fa: true as const,
          email: user.email,
          message: `Tài khoản Quản trị viên yêu cầu xác thực 2 lớp. Mã OTP 6 số đã được gửi tới ${user.email}.`,
        };
      }

      const validAdminOtp = emailService.verifyOtp(user.email, providedOtp, 'ADMIN_2FA');
      if (!validAdminOtp) {
        throw new AppError(
          401,
          ErrorCode.AUTH_OTP_INVALID,
          'Mã OTP xác thực 2 lớp Admin không chính xác hoặc đã hết hạn.'
        );
      }
    }

    // Cấp phát JWT Access Token (15 phút)
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    // Cấp phát Refresh Token (Chuỗi ngẫu nhiên 64 ký tự)
    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const tokenFamily = crypto.randomUUID();

    const refreshDays = dto.rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await authRepository.saveRefreshToken({
      userId: user.id,
      tokenHash,
      tokenFamily,
      expiresAt,
    });

    return {
      requiresAdmin2fa: false as const,
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 phút
      maxAgeMs: refreshDays * 24 * 60 * 60 * 1000,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status,
      },
    };
  },

  /**
   * Cấp mới Access Token (Refresh Token Rotation)
   */
  async refreshToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Không tìm thấy refresh token.');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
      throw new AppError(
        401,
        ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED,
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      );
    }

    // Phát hiện Tái Sử Dụng Token (Replay Attack Detection)
    if (storedToken.is_revoked) {
      // Kẻ gian có thể đã đánh cắp token này! Thu hồi toàn bộ family token ngay lập tức!
      await authRepository.revokeTokenFamily(storedToken.token_family);
      throw new AppError(
        401,
        ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED,
        'Phát hiện dấu hiệu phiên bị chiếm đoạt. Toàn bộ phiên đăng nhập đã bị thu hồi.'
      );
    }

    // Thu hồi token hiện tại
    await authRepository.revokeToken(tokenHash);

    // Kiểm tra User
    const user = await authRepository.findUserById(storedToken.user_id);
    if (!user || user.status === 'BANNED') {
      throw new AppError(403, ErrorCode.AUTH_ACCOUNT_BANNED, 'Tài khoản không hợp lệ.');
    }

    // Tạo Access Token mới
    const newAccessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    // Tạo Refresh Token mới (cùng token_family)
    const newRawRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashToken(newRawRefreshToken);
    const expiresAt = storedToken.expires_at; // giữ nguyên thời hạn tổng của phiên

    await authRepository.saveRefreshToken({
      userId: user.id,
      tokenHash: newTokenHash,
      tokenFamily: storedToken.token_family,
      expiresAt: new Date(expiresAt),
    });

    return {
      newAccessToken,
      newRefreshToken: newRawRefreshToken,
      expiresIn: 900,
      maxAgeMs: new Date(expiresAt).getTime() - Date.now(),
    };
  },

  /**
   * Đăng xuất (Logout)
   */
  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await authRepository.revokeToken(tokenHash);
    }
    return { message: 'Đăng xuất thành công.' };
  },

  /**
   * Xác thực Email / Kích hoạt tài khoản qua OTP / Link (Mục 3.3 Contract)
   */
  async verifyEmail(dto: { email: string; otp?: string; verificationToken?: string }) {
    const user = await authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new AppError(404, ErrorCode.AUTH_UNAUTHORIZED, 'Không tìm thấy tài khoản người dùng.');
    }

    if (user.status === 'ACTIVE') {
      return {
        status: 'ACTIVE' as const,
        message: 'Tài khoản đã được kích hoạt từ trước. Bạn có thể đăng nhập ngay.',
      };
    }

    // Kiểm tra OTP qua emailService
    const validOtp = emailService.verifyOtp(dto.email, dto.otp || '', 'VERIFY');
    const validToken = dto.verificationToken && dto.verificationToken.length >= 16;

    if (!validOtp && !validToken) {
      throw new AppError(
        400,
        ErrorCode.AUTH_OTP_INVALID,
        'Mã OTP không chính xác hoặc đã hết hạn (15 phút). Vui lòng kiểm tra lại Gmail.'
      );
    }

    // Kích hoạt tài khoản
    await authRepository.activateUser(dto.email);

    return {
      status: 'ACTIVE' as const,
      message: 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.',
    };
  },

  /**
   * Gửi lại mã kích hoạt (Mục 3.4 Contract)
   */
  async resendVerification(email: string) {
    const user = await authRepository.findUserByEmail(email);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    emailService.saveOtp(email, otpCode, 'VERIFY');
    emailService.sendActivationEmail(email, user?.full_name || '', otpCode).catch(console.error);

    return {
      message: 'Mã xác thực mới đã được gửi tới hộp thư Gmail của bạn.',
      devOtp: otpCode,
    };
  },

  /**
   * Lấy thông tin phiên hiện tại (Get Profile / Me)
   */
  async getProfile(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, ErrorCode.AUTH_UNAUTHORIZED, 'Không tìm thấy người dùng.');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
    };
  },

  /**
   * Quên Mật Khẩu (Forgot Password - Phát mã OTP đặt lại mật khẩu)
   */
  async forgotPassword(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await authRepository.findUserByEmail(cleanEmail);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    emailService.saveOtp(cleanEmail, otpCode, 'FORGOT');
    emailService.sendPasswordResetEmail(cleanEmail, otpCode).catch(console.error);

    return {
      message: 'Mã OTP đặt lại mật khẩu đã được gửi tới hộp thư Gmail của bạn.',
      devOtp: otpCode,
    };
  },

  /**
   * Đặt Lại Mật Khẩu (Reset Password - Xác thực OTP và lưu mật khẩu mới)
   */
  async resetPassword(dto: ResetPasswordDtoType) {
    const cleanEmail = dto.email.toLowerCase().trim();
    const user = await authRepository.findUserByEmail(cleanEmail);
    if (!user) {
      throw new AppError(404, ErrorCode.AUTH_UNAUTHORIZED, 'Không tìm thấy tài khoản người dùng.');
    }

    // Kiểm tra OTP qua emailService
    const validOtp = emailService.verifyOtp(cleanEmail, dto.otp, 'FORGOT');
    if (!validOtp) {
      throw new AppError(400, ErrorCode.AUTH_OTP_INVALID, 'Mã OTP không chính xác hoặc đã hết hạn (15 phút).');
    }

    // Hash mật khẩu mới với bcrypt (cost >= 12)
    const newPasswordHash = await hashPassword(dto.newPassword);
    await authRepository.updatePassword(cleanEmail, newPasswordHash);

    return {
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.',
    };
  },

  /**
   * Đăng Nhập / Đăng Ký với Google (Chỉ dành cho Khách hàng / Shop; Khóa cứng đối với ADMIN & xác thực token Google)
   */
  async loginWithGoogle(dto: GoogleAuthDtoType) {
    let email = '';
    let fullName = dto.fullName || 'Google User';
    let avatarUrl = dto.avatarUrl;

    // Bắt buộc xác thực trực tiếp qua máy chủ Google (tuyệt đối không tin email thô từ client gửi lên)
    if (dto.credential) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(dto.credential)}`
      );
      if (!verifyRes.ok) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Google ID Token không hợp lệ hoặc đã hết hạn.');
      }
      const gData: any = await verifyRes.json();
      if (!gData.email || gData.email_verified === 'false' || gData.email_verified === false) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Email Google chưa được xác minh.');
      }
      email = gData.email;
      if (gData.name) fullName = gData.name;
      if (gData.picture) avatarUrl = gData.picture;
    } else if (dto.accessToken) {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${dto.accessToken}` },
      });
      if (!userInfoRes.ok) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Phiên xác thực Google OAuth đã hết hạn hoặc không hợp lệ.');
      }
      const gData: any = await userInfoRes.json();
      if (!gData.email || gData.email_verified === false) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Tài khoản Google chưa xác minh email.');
      }
      email = gData.email;
      if (gData.name) fullName = gData.name;
      if (gData.picture) avatarUrl = gData.picture;
    } else {
      throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Thiếu mã xác thực Google OAuth2 hợp lệ.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingAccount = await authRepository.findUserByEmail(cleanEmail);
    const isProtectedAdminEmail =
      existingAccount?.role === 'ADMIN' ||
      cleanEmail === 'levanthang0166@gmail.com' ||
      cleanEmail === 'admin@fitvision3d.com';

    // Bảo mật: Khóa tài khoản Quản trị viên (ADMIN) không cho đăng nhập qua nút Google Social Login
    if (isProtectedAdminEmail) {
      throw new AppError(
        403,
        ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
        'Tài khoản Quản trị viên (Admin) bị khóa đăng nhập qua nút Google để bảo mật hệ thống. Vui lòng nhập Email, Mật khẩu và OTP 2 lớp.'
      );
    }

    const user = await authRepository.findOrCreateGoogleUser({
      email: cleanEmail,
      fullName,
      avatarUrl,
    });

    if (user.status === 'BANNED') {
      throw new AppError(403, ErrorCode.AUTH_ACCOUNT_BANNED, 'Tài khoản Google này đã bị khóa do vi phạm.');
    }

    // Cấp phát JWT Access Token (15 phút)
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    // Cấp phát Refresh Token (30 ngày)
    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const tokenFamily = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await authRepository.saveRefreshToken({
      userId: user.id,
      tokenHash,
      tokenFamily,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status,
      },
    };
  },
};

