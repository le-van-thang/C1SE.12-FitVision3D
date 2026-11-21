/**
 * ============================================================
 * FITVISION 3D - ANTI-SPAM & VALIDATION RULES ENGINE
 * Strict compliance with 01-auth-contract-rules & 02-security-anti-spam-rules
 * ============================================================
 */

/**
 * Danh sách đen các nhà cung cấp email tạm thời / email ảo / email 10 phút (Đồng bộ với Backend)
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempmailo.com',
  'tempmail.net',
  'tempail.com',
  'tempr.email',
  'tmpmail.org',
  'tmpmail.net',
  '10minutemail.com',
  '10minutemail.net',
  '10mail.org',
  'mailinator.com',
  'mailinator.net',
  'maildrop.cc',
  'mailnesia.com',
  'mailcatch.com',
  'mailnull.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'sharklasers.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.de',
  'guerrillamailblock.com',
  'grr.la',
  'throwawaymail.com',
  'getnada.com',
  'nada.ltd',
  'dispostable.com',
  'disposablemail.com',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'trash-mail.com',
  'mytemp.email',
  'mohmal.com',
  'burnermail.io',
  'dropmail.me',
  'crazymailing.com',
  'spambog.com',
  'inboxkitten.com',
  'mintemail.com',
  'emailondeck.com',
  'tempinbox.com',
  'anonymbox.com',
  'spam4.me',
  'spamgourmet.com',
  'moakt.com',
  'luxusmail.org',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
]);

/**
 * Các nhà cung cấp email uy tín phổ biến trên thế giới hiện nay còn hoạt động
 * (Ngoài danh sách này, email công ty/tổ chức/trường học đúng chuẩn vẫn được chấp nhận)
 */
export const TRUSTED_GLOBAL_EMAIL_PROVIDERS = new Set<string>([
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'outlook.com',
  'outlook.com.vn',
  'outlook.jp',
  'outlook.fr',
  'outlook.de',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'live.com',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.com.vn',
  'yahoo.co.uk',
  'yahoo.co.jp',
  'yahoo.fr',
  'yahoo.de',
  'ymail.com',
  'rocketmail.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // Security & Global Providers
  'proton.me',
  'protonmail.com',
  'protonmail.ch',
  'pm.me',
  'tuta.com',
  'tuta.io',
  'tutanota.com',
  'zoho.com',
  'zohomail.com',
  'zohomail.in',
  'aol.com',
  'gmx.com',
  'gmx.net',
  'gmx.de',
  'web.de',
  'mail.com',
  'fastmail.com',
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  // Asia (Korea / China)
  'naver.com',
  'daum.net',
  'hanmail.net',
  'kakao.com',
  'qq.com',
  '163.com',
  '126.com',
  'foxmail.com',
]);

/**
 * Các tên miền hay bị gõ sai chính tả của các dịch vụ lớn -> Gợi ý tên miền đúng
 */
export const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmsil.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gimail.com': 'gmail.com',
  'gmaii.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'hmail.com': 'gmail.com',
  'fmail.com': 'gmail.com',
  'gogglemail.com': 'googlemail.com',
  'googlemai.com': 'googlemail.com',
  'gmail.con': 'gmail.com',
  'gmail.cpm': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.vom': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmail.coom': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.vn': 'gmail.com',
  'gmail.com.vn': 'gmail.com',
  'gmail.net': 'gmail.com',
  'gmail.org': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.cpm': 'yahoo.com',
  'yahoo.cmo': 'yahoo.com',
  // Outlook / Hotmail typos
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'oulook.com': 'outlook.com',
  'outook.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.cpm': 'outlook.com',
  'hotmai.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'homail.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.cpm': 'hotmail.com',
  // iCloud typos
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'icluod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icloud.cpm': 'icloud.com',
  // Proton / Zoho typos
  'protonmai.com': 'protonmail.com',
  'prontonmail.com': 'protonmail.com',
  'protonmail.con': 'protonmail.com',
  'proton.con': 'proton.me',
  'zohomail.con': 'zohomail.com',
};

const INVALID_TYPO_TLDS = new Set([
  'con',
  'cpm',
  'cmo',
  'om',
  'vom',
  'comm',
  'coom',
  'ocm',
  'xom',
  'vnn',
]);

/** Kiểm tra domain có thuộc danh sách rác (bao gồm cả subdomain như abc.yopmail.com) */
export function isDisposableEmailDomain(domain: string): boolean {
  const clean = (domain || '').toLowerCase().trim();
  if (!clean) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(clean)) return true;
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (clean.endsWith('.' + blocked)) return true;
  }
  return false;
}

/** Vietnam & Standard International Mobile (+84 / 0) with prefixes 3, 5, 7, 8, 9 */
export const VN_PHONE_REGEX = /^(?:0|\+84)(?:3|5|7|8|9)[0-9]{8}$/;

/** Email RFC 5322 regex */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Password: 6-32 chars, at least 1 special character */
export const PASSWORD_REGEX = /^(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{6,32}$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  suggestion?: string;
}

/**
 * Normalize and validate Email (Strict syntax + Gmail policy + Typo catch + Anti-disposable)
 */
export function validateEmail(
  rawEmail: string,
  existingEmails: string[] = []
): ValidationResult {
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email) {
    return { valid: false, error: 'Email không được để trống.', code: 'EMAIL_REQUIRED' };
  }

  if (/\s/.test(email)) {
    return {
      valid: false,
      error: 'Email không được chứa khoảng trắng.',
      code: 'EMAIL_INVALID',
    };
  }

  if (/[^\x00-\x7F]/.test(email)) {
    return {
      valid: false,
      error: 'Email không được chứa chữ tiếng Việt có dấu hoặc ký tự đặc biệt ngoài chuẩn quốc tế.',
      code: 'EMAIL_INVALID',
    };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email vượt quá độ dài tối đa (254 ký tự).', code: 'EMAIL_TOO_LONG' };
  }

  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      valid: false,
      error: 'Email phải gồm đúng 1 ký tự @ (ví dụ: ten@gmail.com).',
      code: 'EMAIL_INVALID',
    };
  }

  const [localPart, domain] = parts;

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return {
      valid: false,
      error: 'Phần tên trước @ không được bắt đầu/kết thúc bằng dấu chấm hoặc có hai dấu chấm liền nhau.',
      code: 'EMAIL_INVALID',
    };
  }

  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..') || !domain.includes('.')) {
    return {
      valid: false,
      error: 'Tên miền email chưa hợp lệ (ví dụ đúng: gmail.com, outlook.com).',
      code: 'EMAIL_INVALID',
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Định dạng email không hợp lệ.', code: 'EMAIL_INVALID' };
  }

  const tld = domain.split('.').pop() || '';
  if (tld.length < 2 || /^\d+$/.test(tld)) {
    return {
      valid: false,
      error: 'Đuôi tên miền email không hợp lệ (ví dụ: .com, .vn, .edu.vn).',
      code: 'EMAIL_INVALID',
    };
  }

  if (isDisposableEmailDomain(domain)) {
    return {
      valid: false,
      error: 'Không chấp nhận dịch vụ email tạm thời / email 10 phút (rác) để đăng ký.',
      code: 'AUTH_DISPOSABLE_EMAIL',
    };
  }

  const typoSuggestion = EMAIL_DOMAIN_TYPOS[domain];
  if (typoSuggestion) {
    return {
      valid: false,
      error: `Tên miền "${domain}" có vẻ bị gõ nhầm. Có phải bạn muốn dùng @${typoSuggestion}?`,
      code: 'EMAIL_DOMAIN_TYPO',
      suggestion: `${localPart}@${typoSuggestion}`,
    };
  }

  if (INVALID_TYPO_TLDS.has(tld)) {
    return {
      valid: false,
      error: `Đuôi ".${tld}" không hợp lệ (thường do gõ nhầm từ .com).`,
      code: 'EMAIL_DOMAIN_TYPO',
    };
  }

  // Kiểm tra chuẩn riêng của Google Gmail / Googlemail
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const baseName = localPart.split('+')[0];
    if (!baseName || !/^[a-z0-9.]+$/.test(baseName)) {
      return {
        valid: false,
        error: 'Tên tài khoản Gmail chỉ được dùng chữ cái không dấu (a-z), số (0-9) và dấu chấm (.).',
        code: 'EMAIL_GMAIL_INVALID',
      };
    }
    const strippedDots = baseName.replace(/\./g, '');
    if (strippedDots.length < 6 || strippedDots.length > 30) {
      return {
        valid: false,
        error: 'Tên Gmail chuẩn của Google phải dài từ 6 đến 30 ký tự.',
        code: 'EMAIL_GMAIL_LENGTH',
      };
    }
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
export interface RateLimitResult {
  allowed: boolean;
  waitSeconds?: number;
  waitMinutes?: number;
  remainingAttempts?: number;
  maxAttempts?: number;
  message?: string;
}

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

  public static checkLimit(
    action: string,
    maxAttempts = 5,
    windowSeconds = 30
  ): RateLimitResult {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const history = this.getHistory();
    const timestamps = (history[action] || []).filter((ts) => now - ts < windowMs);

    if (timestamps.length >= maxAttempts) {
      const oldestInWindow = timestamps[0];
      const waitMs = windowMs - (now - oldestInWindow);
      const waitSeconds = Math.max(1, Math.ceil(waitMs / 1000));
      const waitMinutes = Math.ceil(waitSeconds / 60);
      return {
        allowed: false,
        waitSeconds,
        waitMinutes,
        remainingAttempts: 0,
        maxAttempts,
        message: `Bạn đã thao tác quá ${maxAttempts} lần. Vui lòng chờ ${waitSeconds} giây trước khi thử lại.`,
      };
    }

    timestamps.push(now);
    history[action] = timestamps;
    this.saveHistory(history);

    const remainingAttempts = Math.max(0, maxAttempts - timestamps.length);
    return {
      allowed: true,
      remainingAttempts,
      maxAttempts,
    };
  }

  public static reset(action: string) {
    const history = this.getHistory();
    delete history[action];
    this.saveHistory(history);
  }
}

