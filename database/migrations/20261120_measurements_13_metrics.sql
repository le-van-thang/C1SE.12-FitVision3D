-- ============================================================================
-- FitVision 3D - 13-Metric ISO 8559-1 Body Measurements & 3D Mesh Persistence
-- Privacy-by-Design: Zero-Retention for raw body photos (stores metrics & betas only)
-- Date: 2026-11-20
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ensure Biometric Inputs table exists
CREATE TABLE IF NOT EXISTS biometric_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stature_cm NUMERIC(5,2) NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'neutral')),
  calculated_bmi NUMERIC(4,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biometric_user_id ON biometric_inputs (user_id, created_at DESC);

-- 2. Ensure Measurements table exists & upgrade with 5 ISO 8559-1 limb circumferences + metadata
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_id UUID NOT NULL REFERENCES biometric_inputs(id) ON DELETE CASCADE,
  chest_circ_cm NUMERIC(5,2) NOT NULL,
  waist_circ_cm NUMERIC(5,2) NOT NULL,
  hip_circ_cm NUMERIC(5,2) NOT NULL,
  inseam_cm NUMERIC(5,2),
  shoulder_breadth_cm NUMERIC(5,2),
  arm_length_cm NUMERIC(5,2),
  extraction_confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS bicep_circ_cm NUMERIC(5,2);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS wrist_circ_cm NUMERIC(5,2);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS thigh_circ_cm NUMERIC(5,2);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS calf_circ_cm NUMERIC(5,2);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS ankle_circ_cm NUMERIC(5,2);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'scan';
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS is_live_backend BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_measurements_user_created ON measurements (user_id, created_at DESC);

-- 3. Ensure 3D Mesh Parameters table exists (stores SMPL-X betas & scale factors, no image)
CREATE TABLE IF NOT EXISTS mesh_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id UUID UNIQUE NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  base_gender_mesh VARCHAR(20) NOT NULL,
  scale_chest NUMERIC(5,3) NOT NULL DEFAULT 1.000,
  scale_waist NUMERIC(5,3) NOT NULL DEFAULT 1.000,
  scale_hips NUMERIC(5,3) NOT NULL DEFAULT 1.000,
  morph_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ensure System Audit Logs exists (tracks Zero-Retention compliance)
CREATE TABLE IF NOT EXISTS system_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NULL,
  measurement_id UUID NULL,
  action_type VARCHAR(50) NOT NULL,
  execution_time_ms INT NOT NULL DEFAULT 0,
  zero_retention_flag BOOLEAN NOT NULL DEFAULT TRUE,
  ip_address_hash VARCHAR(64) NOT NULL DEFAULT '0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
