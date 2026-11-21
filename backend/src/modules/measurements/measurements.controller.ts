import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { measurementsRepository } from './measurements.repository.js';
import { AppError, sendSuccess } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';

const saveMeasurementSchema = z.object({
  biometric: z.object({
    stature_cm: z.number().min(100).max(250),
    weight_kg: z.number().min(25).max(300),
    gender: z.enum(['male', 'female', 'neutral']),
    calculated_bmi: z.number().min(10).max(70).optional(),
  }),
  measurement: z.object({
    chest_circ_cm: z.number().min(40).max(200),
    waist_circ_cm: z.number().min(35).max(200),
    hip_circ_cm: z.number().min(45).max(210),
    inseam_cm: z.number().min(30).max(130).nullable().optional(),
    shoulder_breadth_cm: z.number().min(20).max(80).nullable().optional(),
    arm_length_cm: z.number().min(30).max(100).nullable().optional(),
    bicep_circ_cm: z.number().min(12).max(80).nullable().optional(),
    wrist_circ_cm: z.number().min(8).max(40).nullable().optional(),
    thigh_circ_cm: z.number().min(25).max(120).nullable().optional(),
    calf_circ_cm: z.number().min(15).max(80).nullable().optional(),
    ankle_circ_cm: z.number().min(10).max(50).nullable().optional(),
    extraction_confidence: z.number().min(0).max(1).nullable().optional(),
  }),
  mesh: z
    .object({
      base_gender_mesh: z.enum(['male', 'female', 'neutral', 'male_base', 'female_base', 'neutral_base']).default('neutral'),
      scale_chest: z.number().min(0.4).max(2.5).default(1),
      scale_waist: z.number().min(0.4).max(2.5).default(1),
      scale_hips: z.number().min(0.4).max(2.5).default(1),
      morph_payload: z.record(z.any()).nullable().optional(),
    })
    .optional(),
  garmentRec: z.record(z.any()).nullable().optional(),
  source: z.enum(['scan', 'manual', 'demo']).default('scan'),
  isLiveBackend: z.boolean().default(false),
  executionTime: z.number().min(0).max(300).default(0),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const measurementsController = {
  async saveSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId || !UUID_REGEX.test(userId)) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Phiên đăng nhập không hợp lệ.');
      }

      const parsed = saveMeasurementSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          issue: e.message,
        }));
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Dữ liệu số đo không hợp lệ.', details);
      }

      const data = parsed.data;
      const saved = await measurementsRepository.saveSnapshot({
        userId,
        ipAddress: req.ip || 'unknown',
        biometric: data.biometric,
        measurement: data.measurement,
        mesh: data.mesh || {
          base_gender_mesh: data.biometric.gender,
          scale_chest: 1,
          scale_waist: 1,
          scale_hips: 1,
          morph_payload: null,
        },
        garmentRec: data.garmentRec ?? null,
        source: data.source,
        isLiveBackend: data.isLiveBackend,
        executionTimeSeconds: data.executionTime,
      });

      sendSuccess(res, saved, 201);
    } catch (err) {
      next(err);
    }
  },

  async getLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId || !UUID_REGEX.test(userId)) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Phiên đăng nhập không hợp lệ.');
      }

      const latest = await measurementsRepository.getLatestByUser(userId);
      sendSuccess(res, latest);
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId || !UUID_REGEX.test(userId)) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Phiên đăng nhập không hợp lệ.');
      }

      const limit = Number(req.query.limit) || 20;
      const history = await measurementsRepository.listByUser(userId, limit);
      sendSuccess(res, history);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!userId || !UUID_REGEX.test(userId)) {
        throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'Phiên đăng nhập không hợp lệ.');
      }
      if (!id || !UUID_REGEX.test(id)) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Mã số đo không hợp lệ.');
      }

      const deleted = await measurementsRepository.deleteById(userId, id);
      if (!deleted) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy bản ghi số đo.');
      }
      sendSuccess(res, { deleted: true, id });
    } catch (err) {
      next(err);
    }
  },
};
