// ============================================================
// FITVISION 3D - RAMANUJAN ELLIPSE CIRCUMFERENCE ALGORITHM
// Buoc 3: Cat lat truc giao va tich phan chu vi elip Ramanujan
// Tham chieu: Srinivasa Ramanujan (1914) - Approximation formula
// Anh dung: MediaPipe Pose (33 moc co the) tren 2 anh truc giao
// ============================================================
// PRIVACY: Chi chay tren RAM trinh duyet - ZERO IMAGE RETENTION

import type {
  EllipseSlice,
  RamanujanResult,
  PoseLandmarks,
} from '../../types/biometrics.types';

// MediaPipe Pose landmark indices (33 points)
// Tham khao: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
const POSE_LANDMARKS = {
  LEFT_SHOULDER:  11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP:       23,
  RIGHT_HIP:      24,
  LEFT_ANKLE:     27,
  RIGHT_ANKLE:    28,
  // Eo duoc noi suy giua shoulder va hip
} as const;

/**
 * Cong thuc xap xi Ramanujan cho chu vi elip (1914).
 *
 * C_raw = pi * [ 3*(a+b) - sqrt( (3a+b)*(a+3b) ) ]
 *
 * Do chinh xac: sai so < 0.4% voi moi ty le b/a (vuot troi so voi
 * cong thuc pi*(a+b) co sai so den 5%).
 *
 * @param a - ban truc lon (ngang): = W/2 (tu anh mat truoc)
 * @param b - ban truc nho (sau):  = D/2 (tu anh mat nghieng)
 * @returns chu vi xap xi (don vi: cm)
 */
export function ramanujanCircumference(a: number, b: number): number {
  if (a <= 0 || b <= 0) {
    throw new Error(`[Ramanujan] Ban truc phai > 0: a=${a}, b=${b}`);
  }
  // Tinh (3a+b) va (a+3b)
  const term1 = 3 * a + b;
  const term2 = a + 3 * b;
  // C = pi * [3(a+b) - sqrt((3a+b)(a+3b))]
  const circumference = Math.PI * (3 * (a + b) - Math.sqrt(term1 * term2));
  return parseFloat(circumference.toFixed(4));
}

/**
 * Trich xuat bề rong ngang W tu anh mat truoc (0 do).
 * W = khoang cach ngang giua 2 diem do trai-phai (px -> cm).
 *
 * @param landmarks      - 33 MediaPipe Pose landmarks (normalized)
 * @param leftIdx        - index landmark ben trai
 * @param rightIdx       - index landmark ben phai
 * @param imageWidth     - chieu rong anh (px)
 * @param ratioMmPerPx   - ty le mm/pixel
 * @returns be rong W (cm)
 */
export function extractWidthFromFront(
  landmarks: PoseLandmarks,
  leftIdx: number,
  rightIdx: number,
  imageWidth: number,
  ratioMmPerPx: number
): number {
  const left  = landmarks[leftIdx];
  const right = landmarks[rightIdx];
  const widthPx = Math.abs(right.x - left.x) * imageWidth;
  return (widthPx * ratioMmPerPx) / 10; // mm -> cm
}

/**
 * Trich xuat be day truoc-sau D tu anh mat nghieng (90 do).
 * D = khoang cach ngang trong khung anh nghieng (dai dien cho chieu sau co the).
 *
 * @param landmarks      - 33 MediaPipe Pose landmarks (normalized)
 * @param frontIdx       - index landmark phia truoc (vd: mui, nguc truoc)
 * @param backIdx        - index landmark phia sau (vd: xuong song)
 * @param imageWidth     - chieu rong anh (px)
 * @param ratioMmPerPx   - ty le mm/pixel
 * @returns be day D (cm)
 */
export function extractDepthFromSide(
  landmarks: PoseLandmarks,
  frontIdx: number,
  backIdx: number,
  imageWidth: number,
  ratioMmPerPx: number
): number {
  const front = landmarks[frontIdx];
  const back  = landmarks[backIdx];
  const depthPx = Math.abs(back.x - front.x) * imageWidth;
  return (depthPx * ratioMmPerPx) / 10; // mm -> cm
}

/**
 * Tinh chu vi elip Ramanujan cho 1 vi tri do (nguc/eo/mong).
 *
 * @param label     - nhan: 'chest' | 'waist' | 'hip'
 * @param W_cm      - be rong ngang (cm) tu anh mat truoc
 * @param D_cm      - be day truoc-sau (cm) tu anh mat nghieng
 * @param deltaH_cm - chieu cao lat cat (cm) de tinh the tich sau
 * @returns RamanujanResult
 */
export function computeRamanujanSlice(
  label: EllipseSlice['label'],
  W_cm: number,
  D_cm: number,
  deltaH_cm: number
): RamanujanResult {
  const a = W_cm / 2; // ban truc lon
  const b = D_cm / 2; // ban truc nho

  const slice: EllipseSlice = {
    label,
    a_cm: parseFloat(a.toFixed(4)),
    b_cm: parseFloat(b.toFixed(4)),
    delta_h_cm: parseFloat(deltaH_cm.toFixed(4)),
  };

  const circumferenceRaw = ramanujanCircumference(a, b);

  return {
    slice,
    circumference_raw_cm: circumferenceRaw,
  };
}

/**
 * Chay toan bo 3 vi tri do (nguc, eo, mong) tu pose landmarks.
 * Eo duoc noi suy o 40% khoang cach tu vai xuong hong.
 *
 * @param frontLandmarks - pose landmarks anh mat truoc
 * @param sideLandmarks  - pose landmarks anh mat nghieng
 * @param imageWidth     - chieu rong anh (px)
 * @param imageHeight    - chieu cao anh (px)
 * @param ratioMmPerPx   - ty le mm/pixel
 * @returns mang 3 RamanujanResult: [chest, waist, hip]
 */
export function computeAllRamanujanSlices(
  frontLandmarks: PoseLandmarks,
  sideLandmarks: PoseLandmarks,
  imageWidth: number,
  imageHeight: number,
  ratioMmPerPx: number
): RamanujanResult[] {
  // --- NGUC: diem noi 2 vai ---
  const W_chest = extractWidthFromFront(
    frontLandmarks,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    imageWidth,
    ratioMmPerPx
  );
  // Chieu sau nguc: 75% chieu rong (ty le nhan trac hoc trung binh)
  const D_chest = W_chest * 0.75;

  // --- EO: noi suy 40% vai-hong ---
  const lShoulder = frontLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const lHip      = frontLandmarks[POSE_LANDMARKS.LEFT_HIP];
  const rShoulder = frontLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const rHip      = frontLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  const waistLeftX  = lShoulder.x + (lHip.x - lShoulder.x) * 0.4;
  const waistRightX = rShoulder.x + (rHip.x - rShoulder.x) * 0.4;
  const W_waist = Math.abs(waistRightX - waistLeftX) * imageWidth * ratioMmPerPx / 10;
  const D_waist = W_waist * 0.85;

  // --- MONG: diem noi 2 hong ---
  const W_hip = extractWidthFromFront(
    frontLandmarks,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    imageWidth,
    ratioMmPerPx
  );
  const D_hip = W_hip * 0.95;

  // Chieu cao mot lat cat (delta_h) = 1/3 chieu cao co the -> tinh the tich sau
  const bodyHeightCm = Math.abs(
    frontLandmarks[POSE_LANDMARKS.LEFT_SHOULDER].y -
    frontLandmarks[POSE_LANDMARKS.LEFT_ANKLE].y
  ) * imageHeight * ratioMmPerPx / 10;
  const deltaH = bodyHeightCm / 3;

  return [
    computeRamanujanSlice('chest', W_chest, D_chest, deltaH),
    computeRamanujanSlice('waist', W_waist, D_waist, deltaH),
    computeRamanujanSlice('hip',   W_hip,   D_hip,   deltaH),
  ];
}
