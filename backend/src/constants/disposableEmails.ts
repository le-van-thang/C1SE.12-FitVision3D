/**
 * FITVISION 3D - DISPOSABLE EMAIL BLACKLIST
 * Danh sách đen các nhà cung cấp email ảo / email 10 phút
 * Tuân thủ @.agent/rules/02-security-anti-spam-rules.md
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.info',
  'throwawaymail.com',
  'getnada.com',
  'dispostable.com',
  'trashmail.com',
  'yopmail.com',
  'fakeinbox.com',
  'sharklasers.com',
  'grr.la',
  'mohmal.com',
  'mytemp.email',
  'burnermail.io',
  'crazymailing.com',
  'dropmail.me',
  'inboxkitten.com'
]);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return Boolean(domain && DISPOSABLE_EMAIL_DOMAINS.has(domain));
}

