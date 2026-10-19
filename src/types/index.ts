/**
 * FitVision 3D (C1SE.12) - Core Type Definitions
 * Based on System Architecture Design & ISO 8559 Anthropometric Standards
 */

export type MeasurementUnit = 'cm' | 'inch';

export type Gender = 'male' | 'female' | 'unisex';

export type ClothingCategory = 'shirt' | 'tshirt' | 'pants' | 'jacket' | 'dress';

export type SizeLabel = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

export type FitType = 'tight' | 'fitted' | 'regular' | 'relaxed' | 'oversized';

/**
 * ISO 8559 Anthropometric Body Measurements
 * ISO 8559-1: Size designation of clothes — Anthropometric definitions for body dimensions
 */
export interface BodyMeasurements {
  id?: string;
  userId?: string;
  createdAt?: string;
  unit: MeasurementUnit;
  
  // Primary dimensions (ISO 8559)
  height: number;                // Chiều cao toàn thân
  chestGirth: number;            // Vòng ngực (Bust / Chest circumference)
  waistGirth: number;            // Vòng eo
  hipGirth: number;              // Vòng mông (Seat circumference)
  
  // Secondary dimensions
  shoulderBreadth: number;       // Chiều rộng vai (Bi-acromial diameter)
  armLength: number;             // Chiều dài cánh tay (Acromion to wrist)
  insideLegLength: number;       // Dài đáy / Chiều dài chân trong (Inseam)
  neckGirth?: number;            // Vòng cổ
  thighGirth?: number;           // Vòng đùi
  bicepGirth?: number;           // Vòng bắp tay
  
  // Extraction metadata
  confidenceScore: number;       // Độ tin cậy tính toán (0.0 - 1.0)
  calibrationScaleRatio?: number;// Tỉ lệ px sang cm (Dựa trên vật chuẩn / Card calibration)
}

/**
 * User Profile & Preferences
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  gender: Gender;
  birthYear?: number;
  avatarUrl?: string;
  preferredUnit: MeasurementUnit;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Size Chart Brand Specification & Recommendation Output
 */
export interface SizeRecommendation {
  category: ClothingCategory;
  brand: string;
  recommendedSize: SizeLabel;
  matchScore: number; // 0 - 100%
  fitType: FitType;
  fitDetails: {
    chestFit: 'tight' | 'perfect' | 'loose';
    waistFit: 'tight' | 'perfect' | 'loose';
    hipFit: 'tight' | 'perfect' | 'loose';
    lengthFit: 'short' | 'perfect' | 'long';
  };
  alternativeSize?: SizeLabel;
  notes?: string;
}

/**
 * Pose Feedback & Guidance Status from Camera Viewfinder
 */
export interface PoseFeedback {
  isAligned: boolean;
  distanceStatus: 'too_close' | 'too_far' | 'optimal';
  lightingQuality: 'poor' | 'fair' | 'good';
  postureCheck: {
    isFullBodyVisible: boolean;
    isFrontFacing: boolean;
    areArmsSpread: boolean;    // A-pose check (~45 degrees)
    areLegsSeparated: boolean; // Legs apart for accurate contour detection
  };
  guidanceMessage: string;
}

/**
 * 2D Keypoint Landmark detected by MediaPipe Pose (33 points)
 */
export interface PoseLandmark2D {
  index: number;
  name: string;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  z: number; // Depth relative to hips
  visibility?: number;
}

/**
 * Scanning Session Lifecycle
 */
export type ScanStep = 'idle' | 'front_capture' | 'side_capture' | 'cv_processing' | 'anthropometry_calc' | 'completed' | 'error';

export interface ScanSession {
  id: string;
  userId?: string;
  status: ScanStep;
  frontImageBase64?: string;
  sideImageBase64?: string;
  landmarksFront?: PoseLandmark2D[];
  landmarksSide?: PoseLandmark2D[];
  measurements?: BodyMeasurements;
  errorMessage?: string;
  createdAt: string;
}
