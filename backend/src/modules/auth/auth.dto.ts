import { z } from 'zod';

const PASSWORD_REGEX = /^(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{6,32}$/;:,.<>?]).*$/;
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
      .min(6, 'M?t kh?u t?i thi?u 6 k� t?.')
      .max(32, 'Mật khẩu tối đa 32 ký tự.')
      ,
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

// 2. DTO Đăng ký Chủ Shop (Shop Owner)
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
    taxCode: z
      .string()
      .trim()
      .regex(/^[0-9]{10}([0-9]{3})?$/, 'Mã số thuế không đúng định dạng.')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
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
      .min(6, 'M?t kh?u t?i thi?u 6 k� t?.')
      .max(32, 'Mật khẩu tối đa 32 ký tự.')
      ,
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
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  googleId: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type GoogleAuthDtoType = z.infer<typeof GoogleAuthDto>;

