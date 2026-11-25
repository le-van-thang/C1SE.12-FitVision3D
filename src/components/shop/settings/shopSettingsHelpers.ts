export type PrepTimeCode = 'SAME_DAY' | '1_2_DAYS' | '2_3_DAYS' | '3_5_DAYS';

export const PREP_TIME_CODES: PrepTimeCode[] = ['SAME_DAY', '1_2_DAYS', '2_3_DAYS', '3_5_DAYS'];

export const MAX_SHOP_IMAGE_BYTES = 500 * 1024; // 500KB after compression
export const MAX_SHOP_IMAGE_DATA_URL_CHARS = 700_000;

/**
 * Normalize legacy Vietnamese/English prep time labels or codes into a canonical code.
 */
export function normalizePrepTimeCode(raw?: string | null): PrepTimeCode {
  const val = String(raw || '').trim();
  if (!val) return '1_2_DAYS';
  const upper = val.toUpperCase();
  if (upper === 'SAME_DAY' || upper === '1_2_DAYS' || upper === '2_3_DAYS' || upper === '3_5_DAYS') {
    return upper;
  }
  const lower = val.toLowerCase();
  if (lower.includes('24h') || lower.includes('trong ngày') || lower.includes('same day')) {
    return 'SAME_DAY';
  }
  if (lower.includes('2–3') || lower.includes('2-3')) {
    return '2_3_DAYS';
  }
  if (lower.includes('3–5') || lower.includes('3-5') || lower.includes('5–7') || lower.includes('5-7')) {
    return '3_5_DAYS';
  }
  return '1_2_DAYS';
}

export function formatPrepTimeLabel(raw: string | null | undefined, locale: 'vi' | 'en'): string {
  const code = normalizePrepTimeCode(raw);
  const labels: Record<PrepTimeCode, { vi: string; en: string }> = {
    SAME_DAY: { vi: 'Trong ngày (24h)', en: 'Same day (24h)' },
    '1_2_DAYS': { vi: '1–2 ngày làm việc', en: '1–2 business days' },
    '2_3_DAYS': { vi: '2–3 ngày làm việc', en: '2–3 business days' },
    '3_5_DAYS': { vi: '3–5 ngày (Hàng đặt trước)', en: '3–5 days (Pre-order)' },
  };
  return labels[code][locale];
}

/**
 * Validate Shop logo/banner URL (only safe http/https URLs or compressed JPEG/PNG/WebP base64).
 */
export function isValidShopImageUrl(raw: string): boolean {
  const val = raw.trim();
  if (!val) return true;
  if (val.length > MAX_SHOP_IMAGE_DATA_URL_CHARS) return false;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(val)) return true;
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(val)) return true;
  return false;
}

export interface ColorVariantDraft {
  colorName: string;
  colorHex: string;
  imageUrl: string;
}

/**
 * Add a custom color to the list without accidentally deleting an existing color
 * if the name or hex matches an existing entry.
 */
export function addCustomColorWithoutToggle(
  prev: ColorVariantDraft[],
  next: { name: string; hex: string },
  maxColors = 6
): { variants: ColorVariantDraft[]; status: 'added' | 'duplicate' | 'max_reached' } {
  const cleanName = next.name.trim();
  const cleanHex = next.hex.trim().toLowerCase();
  const isDuplicate = prev.some(
    (c) =>
      c.colorHex.trim().toLowerCase() === cleanHex ||
      c.colorName.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (isDuplicate) {
    return { variants: prev, status: 'duplicate' };
  }
  if (prev.length >= maxColors) {
    return { variants: prev, status: 'max_reached' };
  }
  return {
    variants: [...prev, { colorName: cleanName || next.hex, colorHex: next.hex, imageUrl: '' }],
    status: 'added',
  };
}

export function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function compressImageToDataUrl(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp ảnh không hợp lệ.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > MAX_SHOP_IMAGE_DATA_URL_CHARS) {
          resolve(canvas.toDataURL('image/jpeg', 0.6));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}
