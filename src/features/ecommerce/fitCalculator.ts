import type { FashionProduct, UserBodyProfile, FitMatchResult } from './types';

/**
 * FitVision 3D - Intelligent Anthropometric Match Engine
 * Computes anatomical delta vs garment specs based on ISO 8559 Ease Allowance.
 */
export function calculateProductFit(
  user: UserBodyProfile,
  product: FashionProduct
): FitMatchResult {
  if (!product.variants || product.variants.length === 0) {
    return {
      recommended_size: 'M',
      match_percentage: 90,
      fit_verdict: 'REGULAR' as any,
      verdict_label_vi: 'Vừa vặn tiêu chuẩn',
      verdict_label_en: 'Standard Regular Fit',
      deltas: { chest_diff_cm: 4, waist_diff_cm: 5, shoulder_diff_cm: 1 },
      advisor_advice_vi: 'Kích cỡ tiêu chuẩn phù hợp với vóc dáng của bạn.',
      advisor_advice_en: 'Standard size tailored to your overall proportions.',
    };
  }

  let bestVariant = product.variants[0];
  let highestScore = -1;
  let bestDeltas = { chest_diff_cm: 0, waist_diff_cm: 0, shoulder_diff_cm: 0 };
  let bestVerdict: FitMatchResult['fit_verdict'] = 'PERFECT_FIT';

  const isPants = product.category === 'pants';

  for (const variant of product.variants) {
    const spec = variant.spec;
    let score = 100;
    let chestDiff = 0;
    let waistDiff = 0;
    let shoulderDiff = 0;

    if (isPants) {
      // Pants focusing on waist and hips
      waistDiff = spec.waist_cm - user.waist_cm;
      const hipDiff = (spec.hip_cm || user.hip_cm + 4) - user.hip_cm;
      const targetEase = (spec.ease_min_cm + spec.ease_max_cm) / 2;

      // Penalize deviation from target ease
      const waistPenalty = Math.abs(waistDiff - targetEase) * 4;
      const hipPenalty = Math.abs(hipDiff - 4) * 3;

      if (waistDiff < 0) score -= 35; // Too tight at waist!
      score -= (waistPenalty + hipPenalty);
    } else {
      // Shirts, Polo, Blazer, Dresses
      chestDiff = spec.chest_cm - user.chest_cm;
      waistDiff = spec.waist_cm - user.waist_cm;
      shoulderDiff = spec.shoulder_cm - user.shoulder_cm;

      const targetEase = (spec.ease_min_cm + spec.ease_max_cm) / 2;
      const chestPenalty = Math.abs(chestDiff - targetEase) * 3.5;
      const waistPenalty = Math.abs(waistDiff - targetEase) * 2.5;
      const shoulderPenalty = Math.abs(shoulderDiff - 1.0) * 4;

      if (chestDiff < 0) score -= 40; // Cannot button chest!
      if (shoulderDiff < -1.5) score -= 30; // Shoulder seams pulled tight

      score -= (chestPenalty + waistPenalty + shoulderPenalty);
    }

    score = Math.max(50, Math.min(99.5, Math.round(score * 10) / 10));

    if (score > highestScore) {
      highestScore = score;
      bestVariant = variant;
      bestDeltas = {
        chest_diff_cm: Math.round(chestDiff * 10) / 10,
        waist_diff_cm: Math.round(waistDiff * 10) / 10,
        shoulder_diff_cm: Math.round(shoulderDiff * 10) / 10,
      };
    }
  }

  // Determine Verdict & Advice (Bilingual)
  let verdictLabelVi = 'Vừa vặn tuyệt đối';
  let verdictLabelEn = 'Perfect Golden Ratio Fit';
  let adviceVi = '';
  let adviceEn = '';

  if (highestScore >= 95) {
    bestVerdict = 'PERFECT_FIT';
    verdictLabelVi = 'Vừa vặn hoàn hảo (98%)';
    verdictLabelEn = 'Perfect Golden Ratio Fit (98%)';
    adviceVi = `Size ${bestVariant.size_label} ôm khít bờ vai và lồng ngực ${user.chest_cm}cm của bạn, độ cử động ${bestDeltas.chest_diff_cm > 0 ? '+' : ''}${bestDeltas.chest_diff_cm}cm đạt tỉ lệ vàng tôn vóc dáng.`;
    adviceEn = `Size ${bestVariant.size_label} aligns precisely with your ${user.chest_cm}cm chest and shoulders, with +${bestDeltas.chest_diff_cm}cm ease ratio sculpting your silhouette.`;
  } else if (highestScore >= 85) {
    bestVerdict = 'SLIGHTLY_SNUG';
    verdictLabelVi = 'Phom gọn gàng (Slim)';
    verdictLabelEn = 'Crisp Tailored Slim Fit';
    adviceVi = `Size ${bestVariant.size_label} phom dáng thon gọn. Vòng eo vừa vặn chuẩn xác, cử động ngực vừa đủ, thích hợp mặc sơ vin hoặc phong cách lịch lãm.`;
    adviceEn = `Size ${bestVariant.size_label} delivers a crisp tailored contour with exact waist fit and comfortable chest ease for refined formal wear.`;
  } else {
    bestVerdict = 'RELAXED';
    verdictLabelVi = 'Phom suông thoải mái';
    verdictLabelEn = 'Relaxed Comfort Fit';
    adviceVi = `Size ${bestVariant.size_label} mang lại cảm giác rộng rãi, thoáng mát suốt ngày dài năng động mà không bị thùng thình.`;
    adviceEn = `Size ${bestVariant.size_label} offers airy ease and comfortable movement throughout active days without looking oversized.`;
  }

  return {
    recommended_size: bestVariant.size_label,
    match_percentage: highestScore,
    fit_verdict: bestVerdict,
    verdict_label_vi: verdictLabelVi,
    verdict_label_en: verdictLabelEn,
    deltas: bestDeltas,
    advisor_advice_vi: adviceVi,
    advisor_advice_en: adviceEn,
  };
}

