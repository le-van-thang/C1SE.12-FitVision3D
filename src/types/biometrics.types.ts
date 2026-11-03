// ============================================================
// FITVISION 3D - BIOMETRICS TYPES
// Types cho: So do, BMI, Pose Landmarks, Pipeline Result
// ============================================================

// MediaPipe landmark point (normalized 0-1)
export interface LandmarkPoint {
  x: number;   // normalized x [0, 1]
  y: number;   // normalized y [0, 1]
  z: number;   // depth (normalized)
  visibility?: number; // [0, 1] confidence
}

// 33 MediaPipe Pose landmarks
export type PoseLandmarks = LandmarkPoint[];

// MediaPipe Face Mesh landmark (468 points)
export type FaceMeshLandmarks = LandmarkPoint[];

// Nasion Anchoring Result (Step 2)
export interface NasionAnchorResult {
  nasion_point: LandmarkPoint;  // landmark #168
  chin_point: LandmarkPoint;    // landmark #152
  face_height_px: number;       // pixel distance nasion -> chin
  skeletal_stature_cm: number;  // chiều cao sọ thực tế (đã loại bỏ sai số tóc)
  hair_error_removed_cm: number; // cm sai số tóc đã bị loại bỏ
}

// Metric Scale Calibration (Step 1)
export type ReferenceCardType = 'A4' | 'ID_CARD';

export interface CalibrationResult {
  card_type: ReferenceCardType;
  card_height_px: number;       // chiều cao thẻ trong ảnh (pixel)
  card_real_height_mm: number;  // chiều cao thực tế (mm): A4=297, ID=53.98
  ratio_mm_per_pixel: number;   // tỷ lệ chuyển đổi mm/px
}

// Ellipse slice for Ramanujan calculation (Step 3)
export interface EllipseSlice {
  label: 'chest' | 'waist' | 'hip';
  a_cm: number;  // semi-major axis (ngang) = W/2
  b_cm: number;  // semi-minor axis (sâu)   = D/2
  delta_h_cm: number; // chiều cao lát cắt
}

// Ramanujan Ellipse Result (Step 3)
export interface RamanujanResult {
  slice: EllipseSlice;
  circumference_raw_cm: number; // C_raw trước penalty
}

// Volume Penalty Result (Step 4)
export interface VolumePenaltyResult {
  v_biological_cm3: number;    // V = (weight_kg / 1.01) * 1000
  v_ellipsoid_cm3: number;     // tổng thể tích elip tích phân
  k_penalty: number;           // hệ số co ngót [0,1] hoặc 1.0 nếu không cần
  penalty_applied: boolean;    // true nếu V_ellipsoid > V_biological * 1.05
}

// Final corrected measurements from pipeline
export interface ExtractedMeasurements {
  chest_circ_cm: number;       // chu vi ngực sau hiệu chỉnh
  waist_circ_cm: number;       // chu vi eo sau hiệu chỉnh
  hip_circ_cm: number;         // chu vi mông sau hiệu chỉnh
  inseam_cm: number | null;    // dài đũng quần trong (nếu đo được)
  shoulder_breadth_cm: number | null; // rộng vai
  extraction_confidence: number; // [0.00-1.00] độ tin cậy
  stature_cm: number;          // chiều cao thực từ Nasion Anchoring
}

// Full pipeline result
export interface PipelineResult {
  calibration: CalibrationResult;
  nasion_anchor: NasionAnchorResult;
  ramanujan_front: RamanujanResult[];  // từ ảnh mặt trước
  ramanujan_side: RamanujanResult[];   // từ ảnh mặt nghiêng
  volume_penalty: VolumePenaltyResult;
  final_measurements: ExtractedMeasurements;
  processing_time_ms: number;  // SLA target: < 3000ms
  zero_retention_confirmed: boolean; // MUST be true
}

// BMI Classification
export type BMICategory =
  | 'underweight'    // BMI < 18.5
  | 'normal'         // 18.5 <= BMI < 25.0
  | 'overweight'     // 25.0 <= BMI < 30.0
  | 'obese';         // BMI >= 30.0

export interface BMIResult {
  value: number;          // numeric(4,2)
  category: BMICategory;
  label_vi?: string;
  label_en?: string;
}

// Camera capture state
export type CameraState =
  | 'idle'
  | 'calibrating'      // đang hiệu chỉnh thước
  | 'front_capture'    // chụp ảnh mặt trước
  | 'side_capture'     // chụp ảnh mặt nghiêng
  | 'processing'       // đang tính toán pipeline
  | 'complete'         // hoàn thành
  | 'error';

export interface PoseQuality {
  is_upright: boolean;        // tư thế đứng thẳng
  is_full_body_visible: boolean; // toàn thân trong khung hình
  confidence_score: number;   // [0,1]
  hud_color: 'orange' | 'green'; // Cam=chưa đạt, Xanh lá=đạt chuẩn
}
