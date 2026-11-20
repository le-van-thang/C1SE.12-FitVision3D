import crypto from 'crypto';
import { pool, query } from '../../config/database.js';

export interface SaveMeasurementInput {
  userId: string;
  ipAddress: string;
  biometric: {
    stature_cm: number;
    weight_kg: number;
    gender: 'male' | 'female' | 'neutral';
    calculated_bmi?: number;
  };
  measurement: {
    chest_circ_cm: number;
    waist_circ_cm: number;
    hip_circ_cm: number;
    inseam_cm?: number | null;
    shoulder_breadth_cm?: number | null;
    arm_length_cm?: number | null;
    bicep_circ_cm?: number | null;
    wrist_circ_cm?: number | null;
    thigh_circ_cm?: number | null;
    calf_circ_cm?: number | null;
    ankle_circ_cm?: number | null;
    extraction_confidence?: number | null;
  };
  mesh: {
    base_gender_mesh: 'male' | 'female' | 'neutral' | 'male_base' | 'female_base' | 'neutral_base';
    scale_chest: number;
    scale_waist: number;
    scale_hips: number;
    morph_payload?: Record<string, any> | null;
  };
  garmentRec?: Record<string, any> | null;
  source: 'scan' | 'manual' | 'demo';
  isLiveBackend: boolean;
  executionTimeSeconds: number;
}

export interface PersistedMeasurementSnapshot {
  id: string;
  userId: string;
  source: 'scan' | 'manual' | 'demo';
  isLiveBackend: boolean;
  executionTime: number;
  updatedAt: string;
  biometric: {
    id: string;
    user_id: string;
    stature_cm: number;
    weight_kg: number;
    gender: 'male' | 'female' | 'other';
    calculated_bmi: number;
    created_at: string;
  };
  measurement: {
    id: string;
    user_id: string;
    input_id: string;
    chest_circ_cm: number;
    waist_circ_cm: number;
    hip_circ_cm: number;
    inseam_cm: number | null;
    shoulder_breadth_cm: number | null;
    arm_length_cm: number | null;
    bicep_circ_cm: number | null;
    wrist_circ_cm: number | null;
    thigh_circ_cm: number | null;
    calf_circ_cm: number | null;
    ankle_circ_cm: number | null;
    extraction_confidence: number | null;
    created_at: string;
  };
  mesh: {
    id: string;
    measurement_id: string;
    base_gender_mesh: 'male' | 'female' | 'neutral';
    scale_chest: number;
    scale_waist: number;
    scale_hips: number;
    morph_payload: Record<string, any> | null;
    created_at: string;
  };
  garmentRec: Record<string, any> | null;
}

function mapRowToSnapshot(row: any): PersistedMeasurementSnapshot {
  const morphPayload = row.morph_payload || {};
  const garmentRec = morphPayload.garment_rec ?? null;
  const normalizedGender: 'male' | 'female' | 'other' =
    row.bio_gender === 'male' ? 'male' : row.bio_gender === 'female' ? 'female' : 'other';

  return {
    id: row.measurement_id,
    userId: row.user_id,
    source: (row.source || 'scan') as 'scan' | 'manual' | 'demo',
    isLiveBackend: Boolean(row.is_live_backend),
    executionTime: Math.round((Number(row.execution_time_ms || 0) / 1000) * 100) / 100,
    updatedAt: new Date(row.meas_created_at).toISOString(),
    biometric: {
      id: row.input_id,
      user_id: row.user_id,
      stature_cm: Number(row.stature_cm),
      weight_kg: Number(row.weight_kg),
      gender: normalizedGender,
      calculated_bmi: Number(row.calculated_bmi),
      created_at: new Date(row.bio_created_at).toISOString(),
    },
    measurement: {
      id: row.measurement_id,
      user_id: row.user_id,
      input_id: row.input_id,
      chest_circ_cm: Number(row.chest_circ_cm),
      waist_circ_cm: Number(row.waist_circ_cm),
      hip_circ_cm: Number(row.hip_circ_cm),
      inseam_cm: row.inseam_cm != null ? Number(row.inseam_cm) : null,
      shoulder_breadth_cm: row.shoulder_breadth_cm != null ? Number(row.shoulder_breadth_cm) : null,
      arm_length_cm: row.arm_length_cm != null ? Number(row.arm_length_cm) : null,
      bicep_circ_cm: row.bicep_circ_cm != null ? Number(row.bicep_circ_cm) : null,
      wrist_circ_cm: row.wrist_circ_cm != null ? Number(row.wrist_circ_cm) : null,
      thigh_circ_cm: row.thigh_circ_cm != null ? Number(row.thigh_circ_cm) : null,
      calf_circ_cm: row.calf_circ_cm != null ? Number(row.calf_circ_cm) : null,
      ankle_circ_cm: row.ankle_circ_cm != null ? Number(row.ankle_circ_cm) : null,
      extraction_confidence:
        row.extraction_confidence != null ? Number(row.extraction_confidence) : null,
      created_at: new Date(row.meas_created_at).toISOString(),
    },
    mesh: {
      id: row.mesh_id || row.measurement_id,
      measurement_id: row.measurement_id,
      base_gender_mesh: (row.base_gender_mesh || 'neutral') as 'male' | 'female' | 'neutral',
      scale_chest: Number(row.scale_chest ?? 1),
      scale_waist: Number(row.scale_waist ?? 1),
      scale_hips: Number(row.scale_hips ?? 1),
      morph_payload: morphPayload,
      created_at: new Date(row.mesh_created_at || row.meas_created_at).toISOString(),
    },
    garmentRec,
  };
}

export const measurementsRepository = {
  /**
   * Saves biometric_inputs + measurements (13 ISO 8559-1 metrics) + mesh_parameters
   * inside one ACID transaction, logging Zero-Retention compliance.
   */
  async saveSnapshot(input: SaveMeasurementInput): Promise<PersistedMeasurementSnapshot> {
    const client = await pool.connect();
    const heightM = input.biometric.stature_cm / 100;
    const computedBmi =
      input.biometric.calculated_bmi ??
      Math.round((input.biometric.weight_kg / (heightM * heightM)) * 100) / 100;
    const execMs = Math.max(0, Math.round((input.executionTimeSeconds || 0) * 1000));
    const ipHash = crypto
      .createHash('sha256')
      .update(input.ipAddress || 'unknown')
      .digest('hex');

    const morphPayload = {
      ...(input.mesh.morph_payload || {}),
      ...(input.garmentRec ? { garment_rec: input.garmentRec } : {}),
    };

    try {
      await client.query('BEGIN');

      const bioRes = await client.query(
        `INSERT INTO biometric_inputs (user_id, stature_cm, weight_kg, gender, calculated_bmi)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at`,
        [
          input.userId,
          input.biometric.stature_cm,
          input.biometric.weight_kg,
          input.biometric.gender,
          computedBmi,
        ]
      );
      const inputId = bioRes.rows[0].id;
      const bioCreatedAt = bioRes.rows[0].created_at;

      const measRes = await client.query(
        `INSERT INTO measurements (
           user_id, input_id, chest_circ_cm, waist_circ_cm, hip_circ_cm,
           inseam_cm, shoulder_breadth_cm, arm_length_cm,
           bicep_circ_cm, wrist_circ_cm, thigh_circ_cm, calf_circ_cm, ankle_circ_cm,
           extraction_confidence, source, is_live_backend, execution_time_ms
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8,
           $9, $10, $11, $12, $13,
           $14, $15, $16, $17
         )
         RETURNING id, created_at`,
        [
          input.userId,
          inputId,
          input.measurement.chest_circ_cm,
          input.measurement.waist_circ_cm,
          input.measurement.hip_circ_cm,
          input.measurement.inseam_cm ?? null,
          input.measurement.shoulder_breadth_cm ?? null,
          input.measurement.arm_length_cm ?? null,
          input.measurement.bicep_circ_cm ?? null,
          input.measurement.wrist_circ_cm ?? null,
          input.measurement.thigh_circ_cm ?? null,
          input.measurement.calf_circ_cm ?? null,
          input.measurement.ankle_circ_cm ?? null,
          input.measurement.extraction_confidence ?? 0.95,
          input.source,
          input.isLiveBackend,
          execMs,
        ]
      );
      const measurementId = measRes.rows[0].id;
      const measCreatedAt = measRes.rows[0].created_at;

      const meshRes = await client.query(
        `INSERT INTO mesh_parameters (
           measurement_id, base_gender_mesh, scale_chest, scale_waist, scale_hips, morph_payload
         ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING id, created_at`,
        [
          measurementId,
          input.mesh.base_gender_mesh,
          input.mesh.scale_chest,
          input.mesh.scale_waist,
          input.mesh.scale_hips,
          JSON.stringify(morphPayload),
        ]
      );
      const meshId = meshRes.rows[0].id;
      const meshCreatedAt = meshRes.rows[0].created_at;

      await client.query(
        `INSERT INTO system_audit_logs (
           user_id, measurement_id, action_type, execution_time_ms, zero_retention_flag, ip_address_hash
         ) VALUES ($1, $2, $3, $4, TRUE, $5)`,
        [
          input.userId,
          measurementId,
          input.source === 'manual' ? 'manual_body_profile' : 'body_scan',
          execMs,
          ipHash,
        ]
      );

      await client.query('COMMIT');

      return mapRowToSnapshot({
        measurement_id: measurementId,
        user_id: input.userId,
        input_id: inputId,
        stature_cm: input.biometric.stature_cm,
        weight_kg: input.biometric.weight_kg,
        bio_gender: input.biometric.gender,
        calculated_bmi: computedBmi,
        bio_created_at: bioCreatedAt,
        chest_circ_cm: input.measurement.chest_circ_cm,
        waist_circ_cm: input.measurement.waist_circ_cm,
        hip_circ_cm: input.measurement.hip_circ_cm,
        inseam_cm: input.measurement.inseam_cm ?? null,
        shoulder_breadth_cm: input.measurement.shoulder_breadth_cm ?? null,
        arm_length_cm: input.measurement.arm_length_cm ?? null,
        bicep_circ_cm: input.measurement.bicep_circ_cm ?? null,
        wrist_circ_cm: input.measurement.wrist_circ_cm ?? null,
        thigh_circ_cm: input.measurement.thigh_circ_cm ?? null,
        calf_circ_cm: input.measurement.calf_circ_cm ?? null,
        ankle_circ_cm: input.measurement.ankle_circ_cm ?? null,
        extraction_confidence: input.measurement.extraction_confidence ?? 0.95,
        source: input.source,
        is_live_backend: input.isLiveBackend,
        execution_time_ms: execMs,
        meas_created_at: measCreatedAt,
        mesh_id: meshId,
        base_gender_mesh: input.mesh.base_gender_mesh,
        scale_chest: input.mesh.scale_chest,
        scale_waist: input.mesh.scale_waist,
        scale_hips: input.mesh.scale_hips,
        morph_payload: morphPayload,
        mesh_created_at: meshCreatedAt,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getLatestByUser(userId: string): Promise<PersistedMeasurementSnapshot | null> {
    const rows = await query(
      `SELECT
         m.id AS measurement_id, m.user_id, m.input_id,
         m.chest_circ_cm, m.waist_circ_cm, m.hip_circ_cm,
         m.inseam_cm, m.shoulder_breadth_cm, m.arm_length_cm,
         m.bicep_circ_cm, m.wrist_circ_cm, m.thigh_circ_cm, m.calf_circ_cm, m.ankle_circ_cm,
         m.extraction_confidence, m.source, m.is_live_backend, m.execution_time_ms,
         m.created_at AS meas_created_at,
         b.stature_cm, b.weight_kg, b.gender AS bio_gender, b.calculated_bmi,
         b.created_at AS bio_created_at,
         mp.id AS mesh_id, mp.base_gender_mesh, mp.scale_chest, mp.scale_waist, mp.scale_hips,
         mp.morph_payload, mp.created_at AS mesh_created_at
       FROM measurements m
       JOIN biometric_inputs b ON b.id = m.input_id
       LEFT JOIN mesh_parameters mp ON mp.measurement_id = m.id
       WHERE m.user_id = $1
       ORDER BY m.created_at DESC
       LIMIT 1`,
      [userId]
    );
    return rows[0] ? mapRowToSnapshot(rows[0]) : null;
  },

  async listByUser(userId: string, limit = 20): Promise<PersistedMeasurementSnapshot[]> {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const rows = await query(
      `SELECT
         m.id AS measurement_id, m.user_id, m.input_id,
         m.chest_circ_cm, m.waist_circ_cm, m.hip_circ_cm,
         m.inseam_cm, m.shoulder_breadth_cm, m.arm_length_cm,
         m.bicep_circ_cm, m.wrist_circ_cm, m.thigh_circ_cm, m.calf_circ_cm, m.ankle_circ_cm,
         m.extraction_confidence, m.source, m.is_live_backend, m.execution_time_ms,
         m.created_at AS meas_created_at,
         b.stature_cm, b.weight_kg, b.gender AS bio_gender, b.calculated_bmi,
         b.created_at AS bio_created_at,
         mp.id AS mesh_id, mp.base_gender_mesh, mp.scale_chest, mp.scale_waist, mp.scale_hips,
         mp.morph_payload, mp.created_at AS mesh_created_at
       FROM measurements m
       JOIN biometric_inputs b ON b.id = m.input_id
       LEFT JOIN mesh_parameters mp ON mp.measurement_id = m.id
       WHERE m.user_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [userId, safeLimit]
    );
    return rows.map(mapRowToSnapshot);
  },

  async deleteById(userId: string, measurementId: string): Promise<boolean> {
    const rows = await query<{ input_id: string }>(
      `DELETE FROM measurements WHERE id = $1 AND user_id = $2 RETURNING input_id`,
      [measurementId, userId]
    );
    if (rows.length === 0) return false;
    await query(`DELETE FROM biometric_inputs WHERE id = $1 AND user_id = $2`, [
      rows[0].input_id,
      userId,
    ]);
    return true;
  },
};
