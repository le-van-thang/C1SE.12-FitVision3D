// ============================================================
// FITVISION 3D (FV3D) - DATABASE TYPES
// Generated from: Supabase PostgreSQL ERD Schema
// Team: C1SE.12 | Advisor: TS. Le Minh Thai
// IMPORTANT: Property names MUST match DB column names exactly
// ============================================================

// ----------------------------------------------------------
// TABLE: profiles
// ----------------------------------------------------------
export interface Profile {
  id: string;                   // uuid pk
  full_name: string;            // varchar(100) NOT NULL
  email: string;                // varchar(255) UNIQUE NOT NULL
  role: 'customer' | 'tailor' | 'retailer' | 'admin'; // varchar(20) NOT NULL
  custom_avatar_mesh_url: string | null; // text
  created_at: string;           // timestamptz NOT NULL
  updated_at: string;           // timestamptz NOT NULL
}

// ----------------------------------------------------------
// TABLE: biometric_inputs
// ----------------------------------------------------------
export interface BiometricInput {
  id: string;                   // uuid pk
  user_id: string;              // uuid NOT NULL -> profiles.id
  stature_cm: number;           // numeric(5,2) NOT NULL
  weight_kg: number;            // numeric(5,2) NOT NULL
  gender: 'male' | 'female' | 'other'; // varchar(10) NOT NULL
  calculated_bmi: number | null; // numeric(4,2)
  created_at: string;           // timestamptz NOT NULL
}

// ----------------------------------------------------------
// TABLE: measurements
// ----------------------------------------------------------
export interface Measurement {
  id: string;                   // uuid pk
  user_id: string;              // uuid NOT NULL -> profiles.id
  input_id: string;             // uuid NOT NULL -> biometric_inputs.id
  chest_circ_cm: number;        // numeric(5,2) NOT NULL
  waist_circ_cm: number;        // numeric(5,2) NOT NULL
  hip_circ_cm: number;          // numeric(5,2) NOT NULL
  inseam_cm: number | null;     // numeric(5,2)
  shoulder_breadth_cm: number | null; // numeric(5,2)
  extraction_confidence: number; // numeric(3,2) NOT NULL [0.00-1.00]
  created_at: string;           // timestamptz NOT NULL
}

// ----------------------------------------------------------
// TABLE: mesh_parameters
// ----------------------------------------------------------
export interface MeshParameter {
  id: string;                   // uuid pk
  measurement_id: string;       // uuid UNIQUE NOT NULL -> measurements.id (1-1)
  base_gender_mesh: 'male_base' | 'female_base' | 'neutral_base'; // varchar(20) NOT NULL
  scale_chest: number;          // numeric(4,3) NOT NULL
  scale_waist: number;          // numeric(4,3) NOT NULL
  scale_hips: number;           // numeric(4,3) NOT NULL
  morph_payload: Record<string, number> | null; // jsonb
  created_at: string;           // timestamptz NOT NULL
}

// ----------------------------------------------------------
// TABLE: garment_categories
// ----------------------------------------------------------
export interface GarmentCategory {
  id: number;                   // serial pk
  name: string;                 // varchar(50) NOT NULL
  target_gender: 'male' | 'female' | 'unisex'; // varchar(10) NOT NULL
  primary_measurement: 'chest_circ_cm' | 'waist_circ_cm' | 'hip_circ_cm' | 'inseam_cm';
  created_at: string;           // timestamptz NOT NULL
}

// ----------------------------------------------------------
// TABLE: brand_size_charts
// ----------------------------------------------------------
export interface BrandSizeChart {
  id: string;                   // uuid pk
  tailor_id: string;            // uuid NOT NULL -> profiles.id
  category_id: number;          // int NOT NULL -> garment_categories.id
  brand_name: string;           // varchar(100) NOT NULL
  size_label: string;           // varchar(10) NOT NULL
  min_chest: number | null;     // numeric(5,2)
  max_chest: number | null;     // numeric(5,2)
  min_waist: number | null;     // numeric(5,2)
  max_waist: number | null;     // numeric(5,2)
  min_hip: number | null;       // numeric(5,2)
  max_hip: number | null;       // numeric(5,2)
  ease_tolerance_cm: number;    // numeric(4,2) NOT NULL
}

// ----------------------------------------------------------
// TABLE: recommendations
// ----------------------------------------------------------
export interface Recommendation {
  id: string;                   // uuid pk
  measurement_id: string;       // uuid NOT NULL -> measurements.id
  size_chart_id: string;        // uuid NOT NULL -> brand_size_charts.id
  recommended_size: string;     // varchar(10) NOT NULL
  fit_type: 'slim' | 'regular' | 'relaxed' | 'oversized'; // varchar(20) NOT NULL
  chest_delta_cm: number | null; // numeric(4,2)
  waist_delta_cm: number | null; // numeric(4,2)
  gemini_advisor_tip: string | null; // text
  created_at: string;           // timestamptz NOT NULL
}

// ----------------------------------------------------------
// TABLE: tailor_dossiers
// ----------------------------------------------------------
export interface TailorDossier {
  id: string;                   // uuid pk
  measurement_id: string;       // uuid NOT NULL -> measurements.id
  tailor_id: string;            // uuid NOT NULL -> profiles.id
  access_token: string;         // varchar(64) UNIQUE NOT NULL
  token_expires_at: string;     // timestamptz NOT NULL
  pdf_export_url: string | null; // text
  created_at: string;           // timestamptz NOT NULL
}

// ----------------------------------------------------------
// TABLE: system_audit_logs
// ----------------------------------------------------------
export interface SystemAuditLog {
  id: number;                   // bigserial pk
  user_id: string | null;       // uuid -> profiles.id (nullable)
  action_type: string;          // varchar(50) NOT NULL
  execution_time_ms: number;    // int NOT NULL
  zero_retention_flag: boolean; // boolean NOT NULL
  ip_address_hash: string;      // varchar(64) NOT NULL
  created_at: string;           // timestamptz NOT NULL
}

// ----------------------------------------------------------
// SUPABASE DATABASE TYPE AGGREGATOR
// ----------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Profile>;
      };
      biometric_inputs: {
        Row: BiometricInput;
        Insert: Omit<BiometricInput, 'id' | 'created_at'>;
        Update: Partial<BiometricInput>;
      };
      measurements: {
        Row: Measurement;
        Insert: Omit<Measurement, 'id' | 'created_at'>;
        Update: Partial<Measurement>;
      };
      mesh_parameters: {
        Row: MeshParameter;
        Insert: Omit<MeshParameter, 'id' | 'created_at'>;
        Update: Partial<MeshParameter>;
      };
      garment_categories: {
        Row: GarmentCategory;
        Insert: Omit<GarmentCategory, 'id' | 'created_at'>;
        Update: Partial<GarmentCategory>;
      };
      brand_size_charts: {
        Row: BrandSizeChart;
        Insert: Omit<BrandSizeChart, 'id'>;
        Update: Partial<BrandSizeChart>;
      };
      recommendations: {
        Row: Recommendation;
        Insert: Omit<Recommendation, 'id' | 'created_at'>;
        Update: Partial<Recommendation>;
      };
      tailor_dossiers: {
        Row: TailorDossier;
        Insert: Omit<TailorDossier, 'id' | 'created_at'>;
        Update: Partial<TailorDossier>;
      };
      system_audit_logs: {
        Row: SystemAuditLog;
        Insert: Omit<SystemAuditLog, 'id' | 'created_at'>;
        Update: Partial<SystemAuditLog>;
      };
    };
  };
}
