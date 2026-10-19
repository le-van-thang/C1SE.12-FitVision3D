// ============================================================
// FITVISION 3D - FITTING TYPES
// Types cho: Size chart matching, Recommendations, Fit Result
// ============================================================

import type { BrandSizeChart, Recommendation } from './database.types';

// Standard size systems
export type SizeSystem = 'US' | 'EU' | 'UK' | 'TCVN' | 'ASIAN';

// Size match score for a single brand_size_chart entry
export interface SizeMatchScore {
  size_chart: BrandSizeChart;
  recommended_size: string;       // vd: "M", "L", "42"
  fit_type: 'slim' | 'regular' | 'relaxed' | 'oversized';
  chest_delta_cm: number | null;  // measurement - chart (cm), dương=lớn hơn chart
  waist_delta_cm: number | null;
  hip_delta_cm: number | null;
  match_score: number;            // [0,1] tổng điểm khớp (1 = hoàn hảo)
  is_recommended: boolean;
}

// Fitting result per garment category
export interface FittingResult {
  category_name: string;
  matches: SizeMatchScore[];
  top_recommendation: Recommendation | null;
  gemini_tip: string | null;
}

// Odometer display value (for animated number flip)
export interface OdometerValue {
  label: string;        // vd: "Ngực", "Eo", "Mông"
  value: number;        // giá trị hiện tại (cm)
  unit: string;         // "cm"
  previous_value: number; // giá trị trước (để animate)
  accent_color: 'cyan' | 'violet'; // màu Cyber-Tailor
}

// Size advisor card props
export interface SizeAdvisorCardProps {
  brand_name: string;
  size_label: string;
  fit_type: 'slim' | 'regular' | 'relaxed' | 'oversized';
  chest_delta_cm: number | null;
  waist_delta_cm: number | null;
  gemini_advisor_tip: string | null;
  match_score: number;
  size_system: SizeSystem;
}

// Tailor Dossier export request
export interface DossierExportRequest {
  measurement_id: string;
  tailor_id: string;
  include_mesh_params: boolean;
  include_gemini_tips: boolean;
  language: 'vi' | 'en';
}

// Fit type labels
export const FIT_TYPE_LABELS_EN: Record<string, string> = {
  slim: 'Slim Fit',
  regular: 'Regular Fit',
  relaxed: 'Relaxed Fit',
  oversized: 'Oversized Fit',
};
export const FIT_TYPE_LABELS_VI = FIT_TYPE_LABELS_EN;

// Standard TCVN size ranges (reference)
export interface TCVNSizeRange {
  size: string;
  chest_min: number;
  chest_max: number;
  waist_min: number;
  waist_max: number;
  hip_min: number;
  hip_max: number;
}

export const TCVN_WOMEN_SIZES: TCVNSizeRange[] = [
  { size: 'XS', chest_min: 76, chest_max: 80, waist_min: 60, waist_max: 64, hip_min: 84, hip_max: 88 },
  { size: 'S',  chest_min: 80, chest_max: 84, waist_min: 64, waist_max: 68, hip_min: 88, hip_max: 92 },
  { size: 'M',  chest_min: 84, chest_max: 88, waist_min: 68, waist_max: 72, hip_min: 92, hip_max: 96 },
  { size: 'L',  chest_min: 88, chest_max: 94, waist_min: 72, waist_max: 78, hip_min: 96, hip_max: 102 },
  { size: 'XL', chest_min: 94, chest_max: 100, waist_min: 78, waist_max: 84, hip_min: 102, hip_max: 108 },
];

export const TCVN_MEN_SIZES: TCVNSizeRange[] = [
  { size: 'S',  chest_min: 82, chest_max: 86, waist_min: 66, waist_max: 70, hip_min: 86, hip_max: 90 },
  { size: 'M',  chest_min: 86, chest_max: 92, waist_min: 70, waist_max: 76, hip_min: 90, hip_max: 96 },
  { size: 'L',  chest_min: 92, chest_max: 98, waist_min: 76, waist_max: 82, hip_min: 96, hip_max: 102 },
  { size: 'XL', chest_min: 98, chest_max: 104, waist_min: 82, waist_max: 88, hip_min: 102, hip_max: 108 },
  { size: 'XXL',chest_min: 104, chest_max: 112, waist_min: 88, waist_max: 96, hip_min: 108, hip_max: 116 },
];
