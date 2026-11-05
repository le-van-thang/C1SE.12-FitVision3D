import sizeCharts from '@shared/size-charts.json';

export type SizeSystem = 'asia' | 'us' | 'eu' | 'uk';
export type FitPreference = 'slim' | 'regular' | 'relaxed';

export interface GarmentCalculationInput {
  gender?: 'male' | 'female' | 'neutral';
  height_cm?: number;
  weight_kg?: number;
  chest_cm: number;
  waist_cm: number;
  hips_cm?: number;
  shoulder_cm?: number;
  inseam_cm?: number;
  preferred_fit?: FitPreference;
}

export interface GarmentSizeOutput {
  topwear: {
    asia: string;
    us: string;
    eu: string;
    uk: string;
    recommended_label: string; // Theo hệ đang chọn
    sub_label: string;          // Hiển thị các hệ còn lại
    is_boundary: boolean;
    boundary_text?: string;
    notes?: string;
  };
  bottomwear: {
    asia: string;
    us: string;
    eu: string;
    uk: string;
    waist_inches: number;
    inseam_inches: number;
    tag: string;                // "Cỡ 28 (28W x 30L) ≈ Size S"
    sub_label: string;          // "US/UK: 28W x 30L"
    notes?: string;
  };
  body_shape_classification: string;
  ease_allowance_recommendation: {
    slim_fit_chest_cm: number;
    regular_fit_chest_cm: number;
    trouser_waist_ease_cm: number;
  };
}

/**
 * Chuẩn hóa chiều dài ống quần (Inseam) về các nấc chuẩn quốc tế (28, 30, 32, 34, 36)
 */
export function normalizeInseam(rawInches: number): number {
  const standards = sizeCharts.standard_inseams || [28, 30, 32, 34, 36];
  let closest = standards[0];
  let minDiff = Math.abs(rawInches - closest);
  for (const s of standards) {
    const diff = Math.abs(rawInches - s);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return closest;
}

/**
 * Thuật toán tính toán kích cỡ đa hệ (Châu Á, US, EU, UK)
 * Tuân thủ ISO 8559 và logic đồng bộ giữa Python & TypeScript.
 */
export function recommendGarmentSizes(
  input: GarmentCalculationInput,
  activeSystem: SizeSystem = 'asia'
): GarmentSizeOutput {
  const isFemale = input.gender === 'female';
  const table = isFemale ? sizeCharts.women : sizeCharts.men;
  const topRows = table.topwear;
  const bottomRows = table.bottomwear;

  const chest = input.chest_cm;
  const waist = input.waist_cm;
  const hips = input.hips_cm ?? 0;
  const shoulder = input.shoulder_cm ?? 0;
  const height = input.height_cm ?? 0;
  const weight = input.weight_kg ?? 0;
  const fit = input.preferred_fit ?? 'regular';

  // 1. TÌM SIZE ÁO (TOPWEAR)
  // Chỉ số chính: Vòng ngực
  let primaryIdx = 0;
  if (chest < topRows[0].chest_min) {
    primaryIdx = 0;
  } else if (chest >= topRows[topRows.length - 1].chest_max) {
    primaryIdx = topRows.length - 1;
  } else {
    for (let i = 0; i < topRows.length; i++) {
      if (chest >= topRows[i].chest_min && chest <= topRows[i].chest_max) {
        primaryIdx = i;
        break;
      }
      if (i < topRows.length - 1 && chest > topRows[i].chest_max && chest < topRows[i + 1].chest_min) {
        // Nằm lơ lửng giữa 2 mốc -> chọn mốc gần hơn
        const diffLow = chest - topRows[i].chest_max;
        const diffHigh = topRows[i + 1].chest_min - chest;
        primaryIdx = diffLow <= diffHigh ? i : i + 1;
        break;
      }
    }
  }

  // Kiểm tra ranh giới giữa 2 size (<= 1cm)
  let isBoundary = false;
  let lowerRow = topRows[primaryIdx];
  let upperRow = topRows[primaryIdx];
  for (let i = 0; i < topRows.length - 1; i++) {
    const boundaryValue = topRows[i].chest_max;
    if (Math.abs(chest - boundaryValue) <= 1.0) {
      isBoundary = true;
      lowerRow = topRows[i];
      upperRow = topRows[i + 1];
      break;
    }
  }

  // Kiểm tra chỉ số thứ 2: Rộng vai (và đối soát cao / nặng)
  let upgradedIdx = primaryIdx;
  let notesReason: string | undefined;

  if (shoulder > 0 && !isFemale) {
    let shoulderIdx = primaryIdx;
    for (let i = 0; i < topRows.length; i++) {
      const row = topRows[i] as any;
      if (row.shoulder_min && row.shoulder_max) {
        if (shoulder >= row.shoulder_min && shoulder <= row.shoulder_max) {
          shoulderIdx = i;
          break;
        }
      }
    }
    if (shoulderIdx > primaryIdx) {
      upgradedIdx = shoulderIdx;
      notesReason = `Khuyên tăng lên cỡ ${topRows[upgradedIdx].asia} do vai rộng (${shoulder}cm)`;
    }
  }

  // Áp dụng form mặc: "Rộng" (relaxed / oversize) = +1 size
  let finalIdx = upgradedIdx;
  if (fit === 'relaxed') {
    finalIdx = Math.min(topRows.length - 1, finalIdx + 1);
  } else if (fit === 'slim' && isBoundary) {
    // Nếu chọn form ôm và đang ở ranh giới -> chọn size dưới
    finalIdx = Math.min(primaryIdx, (topRows as any[]).indexOf(lowerRow));
  }

  const selectedRow = topRows[finalIdx];
  const asiaTop = selectedRow.asia;
  const usTop = selectedRow.us;
  const euTop = selectedRow.eu;
  const ukTop = selectedRow.uk;

  // Xây dựng text hiển thị ranh giới nếu có
  let boundaryText: string | undefined;
  if (isBoundary && fit === 'regular') {
    boundaryText = `${lowerRow.asia} (vừa ôm) hoặc ${upperRow.asia} (thoải mái)`;
  }

  // Label dòng lớn theo hệ đang chọn
  let topRecommended = asiaTop;
  if (isBoundary && fit === 'regular') {
    topRecommended = `${lowerRow.asia} hoặc ${upperRow.asia}`;
  }

  if (activeSystem === 'us') {
    topRecommended = isBoundary && fit === 'regular'
      ? `${lowerRow.us} hoặc ${upperRow.us}`
      : usTop;
  } else if (activeSystem === 'eu') {
    topRecommended = isBoundary && fit === 'regular'
      ? `${lowerRow.eu} hoặc ${upperRow.eu}`
      : euTop;
  } else if (activeSystem === 'uk') {
    topRecommended = isBoundary && fit === 'regular'
      ? `${lowerRow.uk} hoặc ${upperRow.uk}`
      : ukTop;
  }

  // Sub-label hiển thị các hệ khác
  const subParts: string[] = [];
  if (activeSystem !== 'asia') subParts.push(`Châu Á: ${asiaTop}`);
  if (activeSystem !== 'us') subParts.push(`US: ${usTop}`);
  if (activeSystem !== 'eu') subParts.push(`EU: ${euTop}`);
  if (activeSystem !== 'uk') subParts.push(`UK: ${ukTop}`);
  const topSubLabel = subParts.join(' | ');

  if (!notesReason) {
    notesReason = shoulder > 0
      ? `Dựa trên ngực ${chest}cm, vai ${shoulder}cm`
      : `Dựa trên ngực ${chest}cm`;
  }

  // 2. TÌM SIZE QUẦN (BOTTOMWEAR)
  const waistInches = Math.round(waist / 2.54);
  const rawInseamInches = input.inseam_cm ? Math.round(input.inseam_cm / 2.54) : 30;
  const normalizedInseam = normalizeInseam(rawInseamInches);

  // Tìm size chữ Châu Á cho quần
  let bottomIdx = 0;
  if (waist < bottomRows[0].waist_min) {
    bottomIdx = 0;
  } else if (waist >= bottomRows[bottomRows.length - 1].waist_max) {
    bottomIdx = bottomRows.length - 1;
  } else {
    for (let i = 0; i < bottomRows.length; i++) {
      if (waist >= bottomRows[i].waist_min && waist <= bottomRows[i].waist_max) {
        bottomIdx = i;
        break;
      }
      if (i < bottomRows.length - 1 && waist > bottomRows[i].waist_max && waist < bottomRows[i + 1].waist_min) {
        bottomIdx = i;
        break;
      }
    }
  }

  const selectedBottom = bottomRows[bottomIdx];
  const asiaBottom = selectedBottom.asia;
  const usBottom = `${waistInches}W x ${normalizedInseam}L`;

  // Kiểm tra độ chênh lệch mông - eo
  let hipNotes: string | undefined;
  if (hips > 0) {
    const diff = hips - waist;
    const threshold = isFemale ? 28.0 : 20.0;
    if (diff > threshold) {
      hipNotes = 'Mông khá đầy, nên chọn thêm 1 cỡ hoặc form regular/relaxed.';
    }
  }

  // Tag hiển thị quần
  const trouserTag = `Cỡ ${waistInches} (${waistInches}W x ${normalizedInseam}L) ≈ Size ${asiaBottom}`;
  const trouserSub = `US/UK: ${waistInches}W x ${normalizedInseam}L`;

  // 3. PHÂN LOẠI PHOM DÁNG (BODY SHAPE CLASSIFICATION)
  const ratio = chest / (waist > 0 ? waist : 1);
  let fitType = 'Regular / Balanced (Cân đối tiêu chuẩn)';
  if (ratio > 1.20) {
    fitType = 'V-Shape / Athletic (Thể thao, ngực nở eo thon)';
  } else if (ratio < 1.05) {
    fitType = 'Comfort / Relaxed Fit (Bụng đầy đặn)';
  }

  return {
    topwear: {
      asia: asiaTop,
      us: usTop,
      eu: euTop,
      uk: ukTop,
      recommended_label: topRecommended,
      sub_label: topSubLabel,
      is_boundary: isBoundary,
      boundary_text: boundaryText,
      notes: notesReason,
    },
    bottomwear: {
      asia: asiaBottom,
      us: usBottom,
      eu: String(selectedBottom.waist_inch_min || waistInches),
      uk: usBottom,
      waist_inches: waistInches,
      inseam_inches: normalizedInseam,
      tag: trouserTag,
      sub_label: trouserSub,
      notes: hipNotes,
    },
    body_shape_classification: fitType,
    ease_allowance_recommendation: {
      slim_fit_chest_cm: Math.round((chest + (sizeCharts.ease_allowances?.slim_fit_chest_cm ?? 5.0)) * 10) / 10,
      regular_fit_chest_cm: Math.round((chest + (sizeCharts.ease_allowances?.regular_fit_chest_cm ?? 8.0)) * 10) / 10,
      trouser_waist_ease_cm: Math.round((waist + (sizeCharts.ease_allowances?.trouser_waist_ease_cm ?? 2.0)) * 10) / 10,
    },
  };
}
