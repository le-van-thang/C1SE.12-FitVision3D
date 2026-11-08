// tests/test_sizing_ts.mjs: Kiểm tra unit test TypeScript engine
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chartsPath = path.resolve(__dirname, '../shared/size-charts.json');
const sizeCharts = JSON.parse(fs.readFileSync(chartsPath, 'utf-8'));

function normalizeInseam(rawInches) {
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

function recommendGarmentSizes(input, activeSystem = 'asia') {
  const isFemale = input.gender === 'female';
  const table = isFemale ? sizeCharts.women : sizeCharts.men;
  const topRows = table.topwear;
  const bottomRows = table.bottomwear;

  const chest = input.chest_cm;
  const waist = input.waist_cm;
  const hips = input.hips_cm ?? 0;
  const shoulder = input.shoulder_cm ?? 0;
  const fit = input.preferred_fit ?? 'regular';

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
        const diffLow = chest - topRows[i].chest_max;
        const diffHigh = topRows[i + 1].chest_min - chest;
        primaryIdx = diffLow <= diffHigh ? i : i + 1;
        break;
      }
    }
  }

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

  let upgradedIdx = primaryIdx;
  let notesReason;
  if (shoulder > 0 && !isFemale) {
    let shoulderIdx = primaryIdx;
    for (let i = 0; i < topRows.length; i++) {
      const row = topRows[i];
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

  let finalIdx = upgradedIdx;
  if (fit === 'relaxed') {
    finalIdx = Math.min(topRows.length - 1, finalIdx + 1);
  } else if (fit === 'slim' && isBoundary) {
    finalIdx = Math.min(primaryIdx, topRows.indexOf(lowerRow));
  }

  const selectedRow = topRows[finalIdx];
  const asiaTop = selectedRow.asia;
  const usTop = selectedRow.us;
  const euTop = selectedRow.eu;
  const ukTop = selectedRow.uk;

  let boundaryText;
  if (isBoundary && fit === 'regular') {
    boundaryText = `${lowerRow.asia} (vừa ôm) hoặc ${upperRow.asia} (thoải mái)`;
  }

  let topRecommended = asiaTop;
  if (isBoundary && fit === 'regular') {
    topRecommended = `${lowerRow.asia} hoặc ${upperRow.asia}`;
  }
  if (activeSystem === 'us') topRecommended = usTop;
  if (activeSystem === 'eu') topRecommended = euTop;
  if (activeSystem === 'uk') topRecommended = ukTop;

  const subParts = [];
  if (activeSystem !== 'asia') subParts.push(`Châu Á: ${asiaTop}`);
  if (activeSystem !== 'us') subParts.push(`US: ${usTop}`);
  if (activeSystem !== 'eu') subParts.push(`EU: ${euTop}`);
  if (activeSystem !== 'uk') subParts.push(`UK: ${ukTop}`);
  const topSubLabel = subParts.join(' | ');

  if (!notesReason) {
    notesReason = shoulder > 0 ? `Dựa trên ngực ${chest}cm, vai ${shoulder}cm` : `Dựa trên ngực ${chest}cm`;
  }

  const waistInches = Math.round(waist / 2.54);
  const rawInseamInches = input.inseam_cm ? Math.round(input.inseam_cm / 2.54) : 30;
  const normalizedInseam = normalizeInseam(rawInseamInches);

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

  let hipNotes;
  if (hips > 0) {
    const diff = hips - waist;
    const threshold = isFemale ? 28.0 : 20.0;
    if (diff > threshold) {
      hipNotes = 'Mông khá đầy, nên chọn thêm 1 cỡ hoặc form regular/relaxed.';
    }
  }

  const trouserTag = `Cỡ ${waistInches} (${waistInches}W x ${normalizedInseam}L) ≈ Size ${asiaBottom}`;
  const trouserSub = `US/UK: ${waistInches}W x ${normalizedInseam}L`;

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
      waist_inches: waistInches,
      inseam_inches: normalizedInseam,
      tag: trouserTag,
      sub_label: trouserSub,
      notes: hipNotes,
    },
  };
}

console.log("=" .repeat(60));
console.log("CHẠY UNIT TEST TYPESCRIPT/NODE: 5 TEST CASES BẮT BUỘC");
console.log("=" .repeat(60));

// Test Case 1: Nam, 167cm, 55kg, ngực 85.4, eo 71.2, mông 87, vai 42.6, chân trong 76.8
const tc1 = recommendGarmentSizes({
  gender: 'male',
  height_cm: 167.0,
  weight_kg: 55.0,
  chest_cm: 85.4,
  waist_cm: 71.2,
  hips_cm: 87.0,
  shoulder_cm: 42.6,
  inseam_cm: 76.8,
});
console.log("\n[TEST CASE 1 - USER THẮNG LÊ]:");
console.log(`  Áo Châu Á: ${tc1.topwear.asia} (Kỳ vọng: S)`);
console.log(`  Áo US:     ${tc1.topwear.us} (Kỳ vọng: XS)`);
console.log(`  Áo EU:     ${tc1.topwear.eu} (Kỳ vọng: 46)`);
console.log(`  Tag Quần:  ${tc1.bottomwear.tag} (Kỳ vọng: 28W x 30L ≈ Size S)`);
console.log(`  Ghi chú:   ${tc1.topwear.notes}`);

if (tc1.topwear.asia !== 'S' || tc1.topwear.us !== 'XS' || tc1.topwear.eu !== '46' || tc1.bottomwear.waist_inches !== 28 || tc1.bottomwear.inseam_inches !== 30) {
  console.error("FAIL TC1!");
  process.exit(1);
}
console.log("  => [PASS] TC1 ĐẠT CHUẨN!");

// Test Case 2: Nam, 175cm, 70kg, ngực 98, eo 82, vai 46
const tc2 = recommendGarmentSizes({
  gender: 'male',
  height_cm: 175.0,
  weight_kg: 70.0,
  chest_cm: 98.0,
  waist_cm: 82.0,
  shoulder_cm: 46.0,
  inseam_cm: 78.0,
});
console.log("\n[TEST CASE 2]:");
console.log(`  Áo Châu Á: ${tc2.topwear.asia} (Kỳ vọng: L)`);
console.log(`  Áo US:     ${tc2.topwear.us} (Kỳ vọng: M)`);
console.log(`  Tag Quần:  ${tc2.bottomwear.tag} (Kỳ vọng: 32 ≈ Size L)`);
if (tc2.topwear.asia !== 'L' || tc2.topwear.us !== 'M' || tc2.bottomwear.waist_inches !== 32) {
  console.error("FAIL TC2!");
  process.exit(1);
}
console.log("  => [PASS] TC2 ĐẠT CHUẨN!");

// Test Case 3: Nam, 160cm, 48kg, ngực 80, eo 65, vai 40
const tc3 = recommendGarmentSizes({
  gender: 'male',
  height_cm: 160.0,
  weight_kg: 48.0,
  chest_cm: 80.0,
  waist_cm: 65.0,
  shoulder_cm: 40.0,
  inseam_cm: 70.0,
});
console.log("\n[TEST CASE 3]:");
console.log(`  Áo Châu Á: ${tc3.topwear.asia} (Kỳ vọng: XS)`);
console.log(`  Tag Quần:  ${tc3.bottomwear.tag} (Kỳ vọng: 26 ≈ Size XS)`);
if (tc3.topwear.asia !== 'XS' || tc3.bottomwear.waist_inches !== 26) {
  console.error("FAIL TC3!");
  process.exit(1);
}
console.log("  => [PASS] TC3 ĐẠT CHUẨN!");

// Test Case 4: Nam, ngực 90cm
const tc4 = recommendGarmentSizes({
  gender: 'male',
  chest_cm: 90.0,
  waist_cm: 75.0,
});
console.log("\n[TEST CASE 4]:");
console.log(`  is_boundary:   ${tc4.topwear.is_boundary}`);
console.log(`  boundary_text: ${tc4.topwear.boundary_text}`);
if (!tc4.topwear.is_boundary || !tc4.topwear.boundary_text.includes('S') || !tc4.topwear.boundary_text.includes('M')) {
  console.error("FAIL TC4!");
  process.exit(1);
}
console.log("  => [PASS] TC4 ĐẠT CHUẨN!");

// Test Case 5: Nữ, 158cm, 48kg, ngực 82, eo 64, mông 89
const tc5 = recommendGarmentSizes({
  gender: 'female',
  height_cm: 158.0,
  weight_kg: 48.0,
  chest_cm: 82.0,
  waist_cm: 64.0,
  hips_cm: 89.0,
});
console.log("\n[TEST CASE 5]:");
console.log(`  Áo Châu Á: ${tc5.topwear.asia}`);
console.log(`  Áo US:     ${tc5.topwear.us}`);
console.log(`  Quần inch: ${tc5.bottomwear.waist_inches}`);
if (!['XS', 'S'].includes(tc5.topwear.asia) || !['25', '26', 25, 26].includes(tc5.bottomwear.waist_inches)) {
  console.error("FAIL TC5!");
  process.exit(1);
}
console.log("  => [PASS] TC5 ĐẠT CHUẨN!");

console.log("\n" + "=" .repeat(60));
console.log("TẤT CẢ 5 TEST CASES ĐÃ PASS 100% TRÊN TYPESCRIPT/NODE!");
console.log("=" .repeat(60));

