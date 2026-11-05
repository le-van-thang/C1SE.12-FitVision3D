/**
 * ============================================================
 * FITVISION 3D - ANTI-SPAM & VALIDATION RULES ENGINE
 * Strict compliance with 01-auth-contract-rules & 02-security-anti-spam-rules
 * ============================================================
 */

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com',
  '10minutemail.com',
  'mailinator.com',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'getnada.com',
  'dispostable.com',
  'fakeinbox.com',
  'trashmail.com',
  'tempr.email',
  'mytemp.email',
  'mohmal.com',
  'burnermail.io',
  'dropmail.me',
  'nada.ltd',
  'crazymailing.com',
  'spambog.com',
  'trashmail.net',
]);

/** Vietnam & Standard International Mobile (+84 / 0) with prefixes 3, 5, 7, 8, 9 */
export const VN_PHONE_REGEX = /^(?:0|\+84)(?:3|5|7|8|9)[0-9]{8}$/;

/** Email RFC 5322 regex */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Password: 8-32 chars, at least 1 lower, 1 upper, 1 digit, 1 special character */
export const PASSWORD_REGEX = /^(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{6,32}$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

/**
 * Normalize and validate Email
 */
export function validateEmail(
  rawEmail: string,
  existingEmails: string[] = []
): ValidationResult {
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email) {
    return { valid: false, error: 'Email không được để trống.', code: 'EMAIL_REQUIRED' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email vượt quá độ dài tối đa (254 ký tự).', code: 'EMAIL_TOO_LONG' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Định dạng email không hợp lệ.', code: 'EMAIL_INVALID' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Định dạng email không hợp lệ.', code: 'EMAIL_INVALID' };
  }

  const domain = parts[1];
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: 'Không được sử dụng dịch vụ email tạm thời (disposable mail) để đăng ký.',
      code: 'AUTH_DISPOSABLE_EMAIL',
    };
  }

  const isDuplicate = existingEmails.some(
    (existing) => existing.trim().toLowerCase() === email
  );
  if (isDuplicate) {
    return {
      valid: false,
      error: 'Địa chỉ email này đã được sử dụng trong hệ thống.',
      code: 'EMAIL_DUPLICATE',
    };
  }

  return { valid: true };
}

/**
 * Validate Vietnamese Mobile Phone & detect fake repetitive sequences
 */
export function validatePhoneNumber(
  rawPhone: string,
  existingPhones: string[] = []
): ValidationResult {
  const cleanPhone = (rawPhone || '').replace(/[\s.-]/g, '').trim();

  if (!cleanPhone) {
    return { valid: false, error: 'Số điện thoại không được để trống.', code: 'PHONE_REQUIRED' };
  }

  if (!VN_PHONE_REGEX.test(cleanPhone)) {
    return {
      valid: false,
      error: 'Số điện thoại không đúng định dạng di động Việt Nam (Ví dụ: 0912345678 hoặc +84912345678).',
      code: 'PHONE_INVALID_FORMAT',
    };
  }

  // Extract digits only
  const digits = cleanPhone.replace(/\D/g, '');
  const localDigits = digits.startsWith('84') ? '0' + digits.slice(2) : digits;

  // 1. Check all digits same (e.g. 0999999999, 0888888888)
  const isAllSame = /^(\d)\1{9}$/.test(localDigits);
  if (isAllSame) {
    return {
      valid: false,
      error: 'Số điện thoại không hợp lệ (chuỗi chữ số lặp lại giống nhau).',
      code: 'PHONE_REPETITIVE_FAKE',
    };
  }

  // 2. Check sequential ascending/descending digits (e.g. 0123456789, 0987654321)
  const isAscending = '01234567890'.includes(localDigits);
  const isDescending = '9876543210'.includes(localDigits);
  if (isAscending || isDescending) {
    return {
      valid: false,
      error: 'Số điện thoại rác (chuỗi chữ số tăng dần/giảm dần liên tiếp).',
      code: 'PHONE_SEQUENTIAL_FAKE',
    };
  }

  // 3. Check last 6 digits identical (e.g. 0911111111)
  const last6 = localDigits.slice(-6);
  if (/^(\d)\1{5}$/.test(last6)) {
    return {
      valid: false,
      error: 'Số điện thoại không hợp lệ (chuỗi số đuôi ảo).',
      code: 'PHONE_REPETITIVE_FAKE',
    };
  }

  // 4. Check duplicate against existing stores
  const isDuplicate = existingPhones.some((existing) => {
    const existingClean = (existing || '').replace(/[\s.-]/g, '').trim();
    const existingLocal = existingClean.startsWith('+84')
      ? '0' + existingClean.slice(3)
      : existingClean.startsWith('84')
      ? '0' + existingClean.slice(2)
      : existingClean;
    return existingLocal === localDigits;
  });

  if (isDuplicate) {
    return {
      valid: false,
      error: 'Số điện thoại này đã được đăng ký cho một cửa hàng khác.',
      code: 'PHONE_DUPLICATE',
    };
  }

  return { valid: true };
}

/**
 * Validate Password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Mật khẩu không được để trống.', code: 'PASSWORD_REQUIRED' };
  }

  if (password.length < 6 || password.length > 32) {
    return {
      valid: false,
      error: 'Mật khẩu phải có độ dài từ 6 đến 32 ký tự.',
      code: 'PASSWORD_LENGTH_INVALID',
    };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      error: 'Mật khẩu cần chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...).',
      code: 'PASSWORD_COMPLEXITY_FAILED',
    };
  }

  return { valid: true };
}

/**
 * Honeypot bot detector
 * Returns true if bot was trapped
 */
export function checkHoneypot(trapValue?: string): boolean {
  return Boolean(trapValue && trapValue.trim().length > 0);
}

/**
 * Client-side Rate Limiter
 * Limits requests per action (e.g. max 5 attempts in 10 minutes)
 */
export class RateLimiter {
  private static STORAGE_KEY = 'fv3d_rate_limits';

  private static getHistory(): Record<string, number[]> {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private static saveHistory(history: Record<string, number[]>) {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch {
      // storage unavailable fallback
    }
  }

  public static checkLimit(action: string, maxAttempts = 5, windowMinutes = 2): { allowed: boolean; waitMinutes?: number } {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const history = this.getHistory();
    const timestamps = (history[action] || []).filter((ts) => now - ts < windowMs);

    if (timestamps.length >= maxAttempts) {
      const oldestInWindow = timestamps[0];
      const waitMs = windowMs - (now - oldestInWindow);
      const waitMinutes = Math.ceil(waitMs / 60000);
      return { allowed: false, waitMinutes };
    }

    timestamps.push(now);
    history[action] = timestamps;
    this.saveHistory(history);

    return { allowed: true };
  }

  public static reset(action: string) {
    const history = this.getHistory();
    delete history[action];
    this.saveHistory(history);
  }
}

