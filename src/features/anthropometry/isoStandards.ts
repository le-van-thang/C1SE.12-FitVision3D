import type { Gender, SizeLabel, ClothingCategory, SizeRecommendation } from '@/types';

/**
 * ISO 8559 Standard Sizing Chart Tables (cm)
 * ISO 8559-2: Size designation of clothes — Primary and secondary dimension indicators
 */
export interface StandardSizeInterval {
  size: SizeLabel;
  chestMin: number;
  chestMax: number;
  waistMin: number;
  waistMax: number;
  hipMin: number;
  hipMax: number;
  heightMin: number;
  heightMax: number;
}

export const MEN_SIZE_CHART: StandardSizeInterval[] = [
  { size: 'XS', chestMin: 82, chestMax: 87, waistMin: 68, waistMax: 73, hipMin: 84, hipMax: 89, heightMin: 160, heightMax: 168 },
  { size: 'S',  chestMin: 88, chestMax: 93, waistMin: 74, waistMax: 79, hipMin: 90, hipMax: 95, heightMin: 165, heightMax: 172 },
  { size: 'M',  chestMin: 94, chestMax: 99, waistMin: 80, waistMax: 85, hipMin: 96, hipMax: 101, heightMin: 170, heightMax: 178 },
  { size: 'L',  chestMin: 100, chestMax: 105, waistMin: 86, waistMax: 91, hipMin: 102, hipMax: 107, heightMin: 175, heightMax: 183 },
  { size: 'XL', chestMin: 106, chestMax: 111, waistMin: 92, waistMax: 97, hipMin: 108, hipMax: 113, heightMin: 180, heightMax: 188 },
  { size: '2XL', chestMin: 112, chestMax: 118, waistMin: 98, waistMax: 104, hipMin: 114, hipMax: 120, heightMin: 185, heightMax: 195 },
];

export const WOMEN_SIZE_CHART: StandardSizeInterval[] = [
  { size: 'XS', chestMin: 78, chestMax: 82, waistMin: 60, waistMax: 64, hipMin: 86, hipMax: 90, heightMin: 152, heightMax: 160 },
  { size: 'S',  chestMin: 83, chestMax: 87, waistMin: 65, waistMax: 69, hipMin: 91, hipMax: 95, heightMin: 156, heightMax: 164 },
  { size: 'M',  chestMin: 88, chestMax: 92, waistMin: 70, waistMax: 74, hipMin: 96, hipMax: 100, heightMin: 160, heightMax: 168 },
  { size: 'L',  chestMin: 93, chestMax: 97, waistMin: 75, waistMax: 79, hipMin: 101, hipMax: 105, heightMin: 164, heightMax: 172 },
  { size: 'XL', chestMin: 98, chestMax: 103, waistMin: 80, waistMax: 85, hipMin: 106, hipMax: 111, heightMin: 168, heightMax: 176 },
  { size: '2XL', chestMin: 104, chestMax: 110, waistMin: 86, waistMax: 92, hipMin: 112, hipMax: 118, heightMin: 170, heightMax: 180 },
];

/**
 * Match ISO 8559 dimensions to best clothing size recommendation
 */
export function matchIsoSize(
  chest: number,
  waist: number,
  hip: number,
  gender: Gender = 'male',
  category: ClothingCategory = 'shirt'
): SizeRecommendation {
  const chart = gender === 'female' ? WOMEN_SIZE_CHART : MEN_SIZE_CHART;

  // Find size interval that best matches chest and waist
  let bestMatch = chart[2]; // Default M
  let smallestDiff = Infinity;

  for (const interval of chart) {
    const chestMid = (interval.chestMin + interval.chestMax) / 2;
    const waistMid = (interval.waistMin + interval.waistMax) / 2;
    const diff = Math.abs(chest - chestMid) * 1.5 + Math.abs(waist - waistMid);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestMatch = interval;
    }
  }

  // Determine fit details
  const chestFit = chest < bestMatch.chestMin ? 'loose' : chest > bestMatch.chestMax ? 'tight' : 'perfect';
  const waistFit = waist < bestMatch.waistMin ? 'loose' : waist > bestMatch.waistMax ? 'tight' : 'perfect';
  const hipFit = hip < bestMatch.hipMin ? 'loose' : hip > bestMatch.hipMax ? 'tight' : 'perfect';

  const matchScore = Math.max(75, Math.min(98, Math.round(100 - smallestDiff * 2)));

  return {
    category,
    brand: 'ISO 8559 Standard',
    recommendedSize: bestMatch.size,
    matchScore,
    fitType: 'regular',
    fitDetails: {
      chestFit,
      waistFit,
      hipFit,
      lengthFit: 'perfect',
    },
    notes: `Khuyến nghị size ${bestMatch.size} chuẩn xác ${matchScore}% theo bảng thông số tiêu chuẩn ISO 8559.`,
  };
}
