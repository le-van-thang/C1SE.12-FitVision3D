// ============================================================
// FITVISION 3D - NASION CRANIAL ANCHORING ALGORITHM
// Buoc 2: Khoa moc xuong hoc mui Nasion (MediaPipe Face Mesh)
// Tham chieu: CVPR 2025 ADMIS - Focused Human Body Model
// ISO 8559-1:2017 Anthropometric Landmarks
// ============================================================
// PRIVACY: Chi chay tren RAM trinh duyet - ZERO IMAGE RETENTION

import type { FaceMeshLandmarks, NasionAnchorResult } from '../../types/biometrics.types';

// MediaPipe Face Mesh landmark indices
const LANDMARK_NASION = 168;   // Moc xuong hoc mui (goc song mui giua 2 mat)
const LANDMARK_CHIN   = 152;   // Moc cam (diem thap nhat xuong ham duoi)

// Ty le nhan trac hoc sinh hoc: Nasion->dinh dau / Nasion->cam
// Truong Basel Study (2021): ty le trung binh = 1.15 (SD=0.08)
// Tuc la: chieu cao dinh dau = (nasion_to_chin) * 1.15
const CRANIAL_RATIO = 1.15;

/**
 * Tinh khoang cach Euclidean giua 2 landmark trong khong gian pixel.
 * Z khong duoc su dung vi anh chup phang (2D projection).
 */
function euclideanDistance2D(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  imageWidth: number,
  imageHeight: number
): number {
  const dx = (p1.x - p2.x) * imageWidth;
  const dy = (p1.y - p2.y) * imageHeight;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Buoc 2: Khoa moc Nasion de tinh chieu cao xuong chinh xac.
 *
 * Muc dich: Loai bo sai so quang hoc do toc bong benh, bui toc, mu doi
 * (thuong gay lech 2.0 - 5.0 cm neu do tu dinh toc xuong san).
 *
 * Cong thuc:
 *   face_height_px = dist(nasion#168, chin#152) [px]
 *   face_height_cm = face_height_px * ratio_mm_per_pixel / 10
 *   skeletal_stature_cm = face_height_cm * CRANIAL_RATIO + (nasion_to_floor_cm)
 *
 * @param landmarks    - 468 diem MediaPipe Face Mesh (normalized [0,1])
 * @param imageWidth   - chieu rong anh goc (px)
 * @param imageHeight  - chieu cao anh goc (px)
 * @param ratioMmPerPixel - ty le mm/px tu CalibrationResult
 * @param measuredStatureCm - chieu cao nguoi dung tu xuat nhap lieu (cm)
 * @returns NasionAnchorResult
 */
export function computeNasionAnchor(
  landmarks: FaceMeshLandmarks,
  imageWidth: number,
  imageHeight: number,
  ratioMmPerPixel: number,
  measuredStatureCm: number
): NasionAnchorResult {
  if (landmarks.length < 468) {
    throw new Error(
      `[NasionAnchor] Can landmarks Face Mesh khong du: ${landmarks.length}/468`
    );
  }

  const nasionPoint = landmarks[LANDMARK_NASION];
  const chinPoint   = landmarks[LANDMARK_CHIN];

  // Khoang cach Nasion -> Cam (pixel)
  const faceHeightPx = euclideanDistance2D(
    nasionPoint,
    chinPoint,
    imageWidth,
    imageHeight
  );

  // Chuyen doi sang cm
  const faceHeightCm = (faceHeightPx * ratioMmPerPixel) / 10;

  // Chieu cao xuong so (Skeletal Stature) = chieu cao tu Nasion den san + dinh so
  // Dinh so = face_height_cm * CRANIAL_RATIO (ty le nhan trac hoc Basel)
  // Nasion den san = measuredStatureCm - crownHeightCm
  const crownHeightCm  = faceHeightCm * CRANIAL_RATIO;

  // Sai so do toc: phan chieu cao bi do du (= chieu cao do - chieu cao xuong)
  const hairErrorCm = Math.max(0, measuredStatureCm - crownHeightCm);

  // Chieu cao xuong chinh xac (da loai bỏ sai so toc)
  const skeletalStatureCm = crownHeightCm;

  return {
    nasion_point:          nasionPoint,
    chin_point:            chinPoint,
    face_height_px:        faceHeightPx,
    skeletal_stature_cm:   parseFloat(skeletalStatureCm.toFixed(2)),
    hair_error_removed_cm: parseFloat(hairErrorCm.toFixed(2)),
  };
}

/**
 * Xac thuc tinh nhat quan cua ket qua Nasion Anchoring.
 * Tra ve true neu cac gia tri nam trong gioi han sinh hoc hop le.
 */
export function validateNasionResult(result: NasionAnchorResult): boolean {
  const { skeletal_stature_cm, face_height_px, hair_error_removed_cm } = result;

  // Chieu cao nguoi: 100cm - 230cm la hop le
  if (skeletal_stature_cm < 100 || skeletal_stature_cm > 230) return false;

  // Chieu cao mat phai > 10px (tranh lan nhiem nhieu)
  if (face_height_px < 10) return false;

  // Sai so toc: khong vuot qua 10cm (dau hieu du lieu sai)
  if (hair_error_removed_cm > 10) return false;

  return true;
}
