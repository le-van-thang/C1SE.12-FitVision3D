import { z } from 'zod';
import { validateVietnamCCCD, validateVietnamTaxCode } from '../shop/kycVerification.js';

const PASSWORD_REGEX = /^(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?]).{6,32}$/;
const VIETNAM_PHONE_REGEX = /^(84|0)[35789][0-9]{8}$/;

// 1. DTO Đăng ký Khách Hàng (User)
export const RegisterDto = z
  .object({
    email: z
      .string({ required_error: 'Vui lòng nhập địa chỉ email.' })
      .trim()
      .min(1, 'Vui lòng nhập địa chỉ email.')
      .email('Email không đúng định dạng.')
      .max(254, 'Email không được vượt quá 254 ký tự.')
      .toLowerCase(),
    fullName: z
      .string({ required_error: 'Vui lòng nhập họ và tên.' })
      .trim()
      .min(2, 'Họ và tên cần từ 2 đến 100 ký tự.')
      .max(100, 'Họ và tên tối đa 100 ký tự.'),
    password: z
      .string({ required_error: 'Vui lòng nhập mật khẩu.' })
      .min(6, 'Mật khẩu phải từ 6 đến 32 ký tự.')
      .max(32, 'Mật khẩu tối đa 32 ký tự.')
      .regex(PASSWORD_REGEX, 'Mật khẩu cần từ 6 đến 32 ký tự và chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...).'),
    confirmPassword: z.string({ required_error: 'Vui lòng nhập lại mật khẩu xác nhận.' }),
    termsAgreed: z.literal(true, {
      errorMap: () => ({ message: 'Vui lòng đồng ý với Điều khoản sử dụng.' }),
    }),
    extraNotes: z.string().optional().default(''), // Honeypot
    turnstileToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  });

export type RegisterDtoType = z.infer<typeof RegisterDto>;

// 2. DTO Đăng ký Chủ Shop (Shop Owner - KYC, Thuế & Ngân hàng chuẩn TMĐT)
export const KycDocumentInputDto = z.object({
  docType: z.enum([
    'CCCD_FRONT',
    'CCCD_BACK',
    'BUSINESS_LICENSE',
    'TAX_REGISTRATION',
    'BRAND_AUTHORIZATION',
  ]),
  fileUrl: z.string().min(1),
  fileName: z.string().max(255).optional(),
  qrParsedPayload: z.record(z.any()).optional().nullable(),
});

export const RegisterShopDto = RegisterDto.innerType()
  .extend({
    shopName: z
      .string({ required_error: 'Vui lòng nhập tên cửa hàng.' })
      .trim()
      .min(3, 'Tên cửa hàng phải từ 3 đến 150 ký tự.')
      .max(150, 'Tên cửa hàng không được quá 150 ký tự.'),
    phoneNumber: z
      .string({ required_error: 'Vui lòng nhập số điện thoại.' })
      .trim()
      .regex(VIETNAM_PHONE_REGEX, 'Số điện thoại không hợp lệ.'),
    shopAddress: z
      .string({ required_error: 'Vui lòng nhập địa chỉ cửa hàng.' })
      .trim()
      .min(10, 'Vui lòng nhập địa chỉ kinh doanh rõ ràng.')
      .max(255, 'Địa chỉ tối đa 255 ký tự.'),
    entityType: z.enum(['INDIVIDUAL', 'HOUSEHOLD', 'ENTERPRISE']).optional().default('INDIVIDUAL'),
    nationalId: z.string().trim().optional().default(''),
    taxCode: z.string().trim().optional().default(''),
    businessLicenseNo: z.string().trim().max(255).optional().default(''),
    bankCode: z.string().trim().max(30).optional().default(''),
    bankName: z.string().trim().max(120).optional().default(''),
    bankAccountNumber: z.string().trim().max(40).optional().default(''),
    bankAccountHolder: z.string().trim().max(150).optional().default(''),
    tagline: z.string().trim().max(255).optional().default(''),
    kycDocuments: z.array(KycDocumentInputDto).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mật khẩu xác nhận không khớp.',
        path: ['confirmPassword'],
      });
    }

    if (data.nationalId) {
      const cccdCheck = validateVietnamCCCD(data.nationalId);
      if (!cccdCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: cccdCheck.reason || 'Số CCCD 12 số không hợp lệ.',
          path: ['nationalId'],
        });
      }
    }

    if (data.taxCode) {
      const mstCheck = validateVietnamTaxCode(data.taxCode);
      if (!mstCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: mstCheck.reason || 'Mã số thuế không đúng chuẩn VN.',
          path: ['taxCode'],
        });
      }
    } else if (data.entityType === 'HOUSEHOLD' || data.entityType === 'ENTERPRISE') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.entityType === 'ENTERPRISE'
            ? 'Doanh nghiệp bắt buộc kê khai Mã số thuế hợp lệ.'
            : 'Hộ kinh doanh bắt buộc kê khai Mã số thuế (10 số, 12 số hoặc -888).',
        path: ['taxCode'],
      });
    }

    if (
      (data.entityType === 'HOUSEHOLD' || data.entityType === 'ENTERPRISE') &&
      (!data.businessLicenseNo || data.businessLicenseNo.trim().length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hộ kinh doanh / Doanh nghiệp bắt buộc nhập số Giấy phép kinh doanh.',
        path: ['businessLicenseNo'],
      });
    }

    if (data.bankAccountNumber) {
      if (!/^[0-9]{6,25}$/.test(data.bankAccountNumber.replace(/\s+/g, ''))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Số tài khoản ngân hàng phải gồm từ 6 đến 25 chữ số.',
          path: ['bankAccountNumber'],
        });
      }
      if (!data.bankName || !data.bankAccountHolder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng cung cấp đầy đủ Tên ngân hàng và Tên chủ tài khoản.',
          path: ['bankAccountHolder'],
        });
      }
    }
  });

export type RegisterShopDtoType = z.infer<typeof RegisterShopDto>;

// 3. DTO Đăng nhập (Login)
export const LoginDto = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập email.' })
    .trim()
    .min(1, 'Vui lòng nhập email.')
    .email('Email không đúng định dạng.')
    .toLowerCase(),
  password: z.string({ required_error: 'Vui lòng nhập mật khẩu.' }).min(1, 'Mật khẩu không được để trống.'),
  adminOtp: z.string().trim().optional(),
  rememberMe: z.boolean().optional().default(false),
  turnstileToken: z.string().optional(),
});

export type LoginDtoType = z.infer<typeof LoginDto>;

// 4. DTO Kích hoạt Email / OTP (Mục 3.3 Contract)
export const VerifyEmailDto = z
  .object({
    email: z
      .string({ required_error: 'Vui lòng nhập email.' })
      .trim()
      .email('Email không đúng định dạng.')
      .toLowerCase(),
    otp: z.string().optional(),
    verificationToken: z.string().optional(),
  })
  .refine((data) => Boolean(data.otp || data.verificationToken), {
    message: 'Vui lòng cung cấp mã OTP hoặc verificationToken.',
  });

export type VerifyEmailDtoType = z.infer<typeof VerifyEmailDto>;

// 5. DTO Gửi lại mã kích hoạt
export const ResendVerificationDto = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập email.' })
    .trim()
    .email('Email không đúng định dạng.')
    .toLowerCase(),
});

export type ResendVerificationDtoType = z.infer<typeof ResendVerificationDto>;

// 6. DTO Quên Mật Khẩu (Forgot Password)
export const ForgotPasswordDto = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập email.' })
    .trim()
    .email('Email không đúng định dạng.')
    .toLowerCase(),
});

export type ForgotPasswordDtoType = z.infer<typeof ForgotPasswordDto>;

// 7. DTO Đặt Lại Mật Khẩu (Reset Password)
export const ResetPasswordDto = z
  .object({
    email: z
      .string({ required_error: 'Vui lòng nhập email.' })
      .trim()
      .email('Email không đúng định dạng.')
      .toLowerCase(),
    otp: z.string({ required_error: 'Vui lòng nhập mã OTP.' }).min(6, 'Mã OTP gồm 6 chữ số.').max(6, 'Mã OTP gồm 6 chữ số.'),
    newPassword: z
      .string({ required_error: 'Vui lòng nhập mật khẩu mới.' })
      .min(6, 'Mật khẩu phải từ 6 đến 32 ký tự.')
      .max(32, 'Mật khẩu tối đa 32 ký tự.')
      .regex(PASSWORD_REGEX, 'Mật khẩu cần từ 6 đến 32 ký tự và chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...).'),
    confirmNewPassword: z.string({ required_error: 'Vui lòng xác nhận mật khẩu mới.' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmNewPassword'],
  });

export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;

// 8. DTO Đăng Nhập Google (Google OAuth)
export const GoogleAuthDto = z.object({
  credential: z.string().optional(),
  accessToken: z.string().optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  googleId: z.string().optional(),
  avatarUrl: z.string().optional(),
  mode: z.enum(['signin', 'register']).optional().default('signin'),
});

export type GoogleAuthDtoType = z.infer<typeof GoogleAuthDto>;

// 9. DTO Đổi / Tạo Mật Khẩu (Change Password - cho tài khoản đã đăng nhập)
export const ChangePasswordDto = z
  .object({
    currentPassword: z.string().optional().default(''),
    newPassword: z
      .string({ required_error: 'Vui lòng nhập mật khẩu mới.' })
      .min(6, 'Mật khẩu mới phải từ 6 đến 32 ký tự.')
      .max(32, 'Mật khẩu mới tối đa 32 ký tự.')
      .regex(PASSWORD_REGEX, 'Mật khẩu mới cần từ 6 đến 32 ký tự và chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...).'),
    confirmNewPassword: z.string({ required_error: 'Vui lòng xác nhận mật khẩu mới.' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordDtoType = z.infer<typeof ChangePasswordDto>;


