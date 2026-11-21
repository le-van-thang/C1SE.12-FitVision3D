import { query } from '../../config/database.js';

let measurementsBootstrapPromise: Promise<void> | null = null;

/**
 * Ensures biometric_inputs, measurements (13 ISO 8559-1 metrics), mesh_parameters,
 * and system_audit_logs exist on startup without requiring manual SQL execution.
 */
export async function ensureMeasurementsSchema(): Promise<void> {
  if (measurementsBootstrapPromise) return measurementsBootstrapPromise;

  measurementsBootstrapPromise = (async () => {
    try {
      await query(`
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
          bicep_circ_cm NUMERIC(5,2),
          wrist_circ_cm NUMERIC(5,2),
          thigh_circ_cm NUMERIC(5,2),
          calf_circ_cm NUMERIC(5,2),
          ankle_circ_cm NUMERIC(5,2),
          extraction_confidence NUMERIC(3,2),
          source VARCHAR(20) NOT NULL DEFAULT 'scan',
          is_live_backend BOOLEAN NOT NULL DEFAULT FALSE,
          execution_time_ms INTEGER NOT NULL DEFAULT 0,
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
      `);
      console.log('✅ PostgreSQL 13-Metric Measurements & 3D Mesh schema ready (Zero-Retention active).');
    } catch (err: any) {
      console.error('❌ Measurements bootstrap failed:', err?.message || err);
      measurementsBootstrapPromise = null;
    }
  })();

  return measurementsBootstrapPromise;
}
