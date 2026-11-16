/**
 * FITVISION 3D - DISPOSABLE EMAIL BLACKLIST & DOMAIN VALIDATION
 * Danh sách đen các nhà cung cấp email ảo / email 10 phút (Đồng bộ 100% với Frontend)
 * Tuân thủ @.agent/rules/02-security-anti-spam-rules.md
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

export const TRUSTED_GLOBAL_EMAIL_PROVIDERS = new Set<string>([
  'gmail.com',
  'googlemail.com',
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
  'yahoo.com',
  'yahoo.com.vn',
  'yahoo.co.uk',
  'yahoo.co.jp',
  'yahoo.fr',
  'yahoo.de',
  'ymail.com',
  'rocketmail.com',
  'icloud.com',
  'me.com',
  'mac.com',
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
  'naver.com',
  'daum.net',
  'hanmail.net',
  'kakao.com',
  'qq.com',
  '163.com',
  '126.com',
  'foxmail.com',
]);

export const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
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
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.cpm': 'yahoo.com',
  'yahoo.cmo': 'yahoo.com',
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
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'icluod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icloud.cpm': 'icloud.com',
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

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith('.' + blocked)) return true;
  }
  return false;
}

export function validateEmailDomainAndGmailPolicy(email: string): {
  valid: boolean;
  message?: string;
} {
  const clean = (email || '').trim().toLowerCase();
  if (!clean || /\s/.test(clean) || /[^\x00-\x7F]/.test(clean)) {
    return {
      valid: false,
      message: 'Email không được chứa khoảng trắng hoặc ký tự tiếng Việt có dấu.',
    };
  }

  const parts = clean.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, message: 'Email không đúng định dạng.' };
  }

  const [localPart, domain] = parts;
  const tld = domain.split('.').pop() || '';
  if (tld.length < 2 || /^\d+$/.test(tld)) {
    return {
      valid: false,
      message: 'Đuôi tên miền email không hợp lệ (ví dụ: .com, .vn, .edu.vn).',
    };
  }

  const typoFix = EMAIL_DOMAIN_TYPOS[domain];
  if (typoFix) {
    return {
      valid: false,
      message: `Tên miền "${domain}" có vẻ bị gõ nhầm. Vui lòng kiểm tra lại (@${typoFix}).`,
    };
  }

  if (INVALID_TYPO_TLDS.has(tld)) {
    return {
      valid: false,
      message: `Đuôi ".${tld}" không hợp lệ (thường do gõ nhầm từ .com).`,
    };
  }

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const baseName = localPart.split('+')[0];
    if (!baseName || !/^[a-z0-9.]+$/.test(baseName)) {
      return {
        valid: false,
        message: 'Tên tài khoản Gmail chỉ được chứa chữ cái không dấu (a-z), số (0-9) và dấu chấm (.).',
      };
    }
    const strippedDots = baseName.replace(/\./g, '');
    if (strippedDots.length < 6 || strippedDots.length > 30) {
      return {
        valid: false,
        message: 'Tên Gmail chuẩn của Google phải dài từ 6 đến 30 ký tự.',
      };
    }
  }

  return { valid: true };
}


