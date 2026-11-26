/**
 * Pure helpers for User Settings (device detection, password strength, bank holder normalization).
 */

export interface DetectedDevice {
  browser: string;
  os: string;
  label: string;
}

export function detectCurrentDevice(userAgent?: string): DetectedDevice {
  const ua =
    userAgent ??
    (typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '');

  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

  let os = 'Desktop';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { browser, os, label: `${browser} · ${os}` };
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  level: 'empty' | 'weak' | 'fair' | 'good' | 'strong';
  colorClass: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, level: 'empty', colorClass: 'bg-[#E8E1D3]' };
  }
  let score = 0;
  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, level: 'weak', colorClass: 'bg-[#D8452A]' };
  if (score === 2) return { score: 2, level: 'fair', colorClass: 'bg-[#C98A1B]' };
  if (score === 3) return { score: 3, level: 'good', colorClass: 'bg-[#26356B]' };
  return { score: 4, level: 'strong', colorClass: 'bg-[#3F6B4E]' };
}

export function normalizeBankHolderName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '');
}
