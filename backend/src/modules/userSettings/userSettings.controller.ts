import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userSettingsRepository } from './userSettings.repository.js';
import { sendSuccess } from '../../utils/responseEnvelope.js';

const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const cleanPhone = (v: string) => v.replace(/[\s.-]/g, '');

const phoneSchema = z
  .string()
  .transform(cleanPhone)
  .refine((v) => VN_PHONE.test(v), 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09).');

const safeAvatarUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === '' || /^https:\/\/[^\s"'<>]+$/i.test(v),
    'Ảnh đại diện đồng bộ máy chủ chỉ chấp nhận đường dẫn HTTPS hợp lệ (không nhận tệp nhị phân/base64).'
  )
  .optional();

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ và tên cần tối thiểu 2 ký tự.').max(100).optional(),
  avatarUrl: safeAvatarUrlSchema,
  phone: z.union([phoneSchema, z.literal('')]).default(''),
  city: z.string().trim().max(100).default(''),
  address: z.string().trim().max(255).default(''),
  gender: z.enum(['male', 'female', 'other']).nullable().default(null),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh không hợp lệ.')
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d <= new Date() && d.getFullYear() >= 1900;
    }, 'Ngày sinh không hợp lệ.')
    .nullable()
    .or(z.literal('').transform(() => null))
    .default(null),
  notes: z.string().trim().max(500).default(''),
});

const addressSchema = z.object({
  recipientName: z.string().trim().min(2, 'Vui lòng nhập họ tên người nhận.').max(100),
  phone: phoneSchema,
  city: z.string().trim().min(1, 'Vui lòng nhập tỉnh / thành phố.').max(100),
  district: z.string().trim().max(100).optional(),
  ward: z.string().trim().max(100).optional(),
  detailedAddress: z.string().trim().min(5, 'Vui lòng nhập địa chỉ chi tiết.').max(255),
  label: z.enum(['home', 'office', 'other']).default('home'),
  isDefault: z.boolean().optional(),
});

const stripAccents = (v: string) =>
  v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

const bankSchema = z.object({
  bankCode: z.string().trim().min(2).max(20),
  bankName: z.string().trim().min(2).max(100),
  accountNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ''))
    .refine((v) => /^\d{6,20}$/.test(v), 'Số tài khoản phải gồm 6-20 chữ số.'),
  accountHolderName: z
    .string()
    .transform((v) => stripAccents(v).toUpperCase().replace(/\s+/g, ' ').trim())
    .refine((v) => /^[A-Z ]{2,100}$/.test(v), 'Tên chủ tài khoản chỉ gồm chữ cái, viết hoa không dấu.'),
});

const preferencesSchema = z.object({
  emailOrderUpdates: z.boolean(),
  emailPromotions: z.boolean(),
  easeAllowancePreference: z.enum(['slim', 'regular', 'relaxed']),
});

const uid = (req: Request) => req.user!.sub;

export const userSettingsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = uid(req);
      const [profile, addresses, refundBank, preferences] = await Promise.all([
        userSettingsRepository.getProfile(userId),
        userSettingsRepository.listAddresses(userId),
        userSettingsRepository.getRefundBank(userId),
        userSettingsRepository.getPreferences(userId),
      ]);
      sendSuccess(res, { profile, addresses, refundBank, preferences }, 200);
    } catch (e) {
      next(e);
    }
  },

  async saveProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = profileSchema.parse(req.body);
      sendSuccess(res, await userSettingsRepository.upsertProfile(uid(req), data), 200);
    } catch (e) {
      next(e);
    }
  },

  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addressSchema.parse(req.body);
      sendSuccess(res, { addresses: await userSettingsRepository.saveAddress(uid(req), data) }, 201);
    } catch (e) {
      next(e);
    }
  },

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addressSchema.parse(req.body);
      const id = z.string().uuid().parse(req.params.id);
      sendSuccess(res, { addresses: await userSettingsRepository.saveAddress(uid(req), { ...data, id }) }, 200);
    } catch (e) {
      next(e);
    }
  },

  async setDefaultAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      sendSuccess(res, { addresses: await userSettingsRepository.setDefaultAddress(uid(req), id) }, 200);
    } catch (e) {
      next(e);
    }
  },

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      sendSuccess(res, { addresses: await userSettingsRepository.deleteAddress(uid(req), id) }, 200);
    } catch (e) {
      next(e);
    }
  },

  async saveRefundBank(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bankSchema.parse(req.body);
      sendSuccess(res, await userSettingsRepository.upsertRefundBank(uid(req), data), 200);
    } catch (e) {
      next(e);
    }
  },

  async deleteRefundBank(req: Request, res: Response, next: NextFunction) {
    try {
      await userSettingsRepository.deleteRefundBank(uid(req));
      sendSuccess(res, { message: 'Đã hủy liên kết tài khoản ngân hàng.' }, 200);
    } catch (e) {
      next(e);
    }
  },

  async savePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const data = preferencesSchema.parse(req.body);
      sendSuccess(res, await userSettingsRepository.upsertPreferences(uid(req), data), 200);
    } catch (e) {
      next(e);
    }
  },
};

