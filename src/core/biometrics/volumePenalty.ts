// ============================================================
// FITVISION 3D - VOLUME PENALTY ALGORITHM
// Buoc 4: Hieu chinh the tich va triet tieu do phong quan ao
// Khi V_ellipsoid > V_biological * 1.05 -> ap dung k_penalty
// ============================================================
// PRIVACY: Chi chay tren RAM trinh duyet - ZERO IMAGE RETENTION

import type { RamanujanResult, VolumePenaltyResult } from '../../types/biometrics.types';

// Khoi luong rieng sinh hoc trung binh (g/cm3)
// Tham chieu: Siri (1956), Durnin & Womersley (1974)
const RHO_BODY = 1.01; // g/cm3 = 1010 kg/m3

// Nguong phat hien do phong quan ao (5%)
const CLOTHING_VOLUME_THRESHOLD = 1.05;

/**
 * Tinh the tich sinh hoc ly thuyet tu can nang khai bao.
 *
 * Cong thuc:
 *   V_biological = (M_weight / rho) * 1000
 *   = (M_weight_kg / 1.01) * 1000   [cm3]
 *
 * @param weightKg - can nang nguoi dung (kg)
 * @returns the tich sinh hoc (cm3)
 */
export function computeBiologicalVolume(weightKg: number): number {
  if (weightKg <= 0 || weightKg > 500) {
    throw new Error(`[VolumePenalty] Can nang khong hop le: ${weightKg} kg`);
  }
  return (weightKg / RHO_BODY) * 1000;
}

/**
 * Tinh the tich hinh hoc elipsoid bang tich phan lat cat (Riemann sum).
 *
 * Cong thuc tich phan:
 *   V_ellipsoid = Sum( pi * a_i * b_i * delta_h_i )
 *
 * Moi phan tu RamanujanResult dai dien cho 1 lat cat hinh tru elip
 * co chieu cao delta_h va ban truc a, b.
 *
 * @param slices - mang cac lat cat Ramanujan (chest, waist, hip, ...)
 * @returns the tich hinh hoc (cm3)
 */
export function computeEllipsoidVolume(slices: RamanujanResult[]): number {
  return slices.reduce((total, result) => {
    const { a_cm, b_cm, delta_h_cm } = result.slice;
    // The tich hinh tru elip: V = pi * a * b * h
    const sliceVolume = Math.PI * a_cm * b_cm * delta_h_cm;
    return total + sliceVolume;
  }, 0);
}

/**
 * Buoc 4: Volume Penalty - Triet tieu do phong quan ao.
 *
 * Logic:
 *   1. Tinh V_biological = (weight_kg / 1.01) * 1000  [cm3]
 *   2. Tinh V_ellipsoid  = Sum(pi * a * b * delta_h)  [cm3]
 *   3. Neu V_ellipsoid > V_biological * 1.05:
 *        k_penalty = sqrt(V_biological / V_ellipsoid)  [0 < k < 1]
 *      Nguoc lai:
 *        k_penalty = 1.0  (khong ap dung penalty)
 *   4. C_corrected = C_raw * k_penalty
 *
 * @param slices           - tat ca cac lat cat Ramanujan
 * @param weightKg         - can nang khai bao (kg)
 * @returns VolumePenaltyResult
 */
export function computeVolumePenalty(
  slices: RamanujanResult[],
  weightKg: number
): VolumePenaltyResult {
  const vBiological = computeBiologicalVolume(weightKg);
  const vEllipsoid  = computeEllipsoidVolume(slices);

  const penaltyApplied = vEllipsoid > vBiological * CLOTHING_VOLUME_THRESHOLD;

  let kPenalty: number;
  if (penaltyApplied) {
    // k_penalty = sqrt(V_biological / V_ellipsoid) -- luon < 1
    kPenalty = Math.sqrt(vBiological / vEllipsoid);
  } else {
    kPenalty = 1.0; // khong can hieu chinh
  }

  return {
    v_biological_cm3: parseFloat(vBiological.toFixed(2)),
    v_ellipsoid_cm3:  parseFloat(vEllipsoid.toFixed(2)),
    k_penalty:        parseFloat(kPenalty.toFixed(6)),
    penalty_applied:  penaltyApplied,
  };
}

/**
 * Ap dung Volume Penalty len 1 gia tri chu vi thu (cm).
 *
 * @param circumferenceRawCm - C_raw tu Ramanujan (chua hieu chinh)
 * @param kPenalty           - he so tu computeVolumePenalty
 * @returns C_corrected (cm) - da triet tieu do phong quan ao
 */
export function applyCorrectionFactor(
  circumferenceRawCm: number,
  kPenalty: number
): number {
  return parseFloat((circumferenceRawCm * kPenalty).toFixed(2));
}

/**
 * Hieu chinh toan bo mang RamanujanResult bang Volume Penalty.
 * Tra ve cac gia tri chu vi da duoc chinh sua theo thuc te.
 *
 * @param slices   - mang ket qua Ramanujan
 * @param penalty  - ket qua Volume Penalty
 * @returns Record<label, corrected_cm>
 */
export function applyPenaltyToAllSlices(
  slices: RamanujanResult[],
  penalty: VolumePenaltyResult
): Record<string, number> {
  return slices.reduce(
    (acc, result) => {
      const corrected = applyCorrectionFactor(
        result.circumference_raw_cm,
        penalty.k_penalty
      );
      acc[result.slice.label] = corrected;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Tinh BMI tu chieu cao va can nang.
 * BMI = weight_kg / (stature_m ^ 2)
 *
 * @param weightKg  - can nang (kg)
 * @param statureCm - chieu cao (cm)
 * @returns BMI numeric(4,2)
 */
export function computeBMI(weightKg: number, statureCm: number): number {
  if (statureCm <= 0) throw new Error('[VolumePenalty] Chieu cao phai > 0');
  const statureM = statureCm / 100;
  return parseFloat((weightKg / (statureM * statureM)).toFixed(2));
}
