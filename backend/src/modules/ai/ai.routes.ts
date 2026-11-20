import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { registerRateLimiter } from '../../middlewares/rateLimiter.js';
import { AppError, sendSuccess } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';

export const aiRouter = Router();

const chatSchema = z.object({
  query: z.string().trim().min(1).max(1000),
  locale: z.enum(['vi', 'en']).default('vi'),
  hasVerifiedMeasurements: z.boolean().default(false),
  userBody: z
    .object({
      height_cm: z.number(),
      weight_kg: z.number(),
      chest_cm: z.number(),
      waist_cm: z.number(),
      hip_cm: z.number(),
    })
    .nullable()
    .optional(),
});

/**
 * POST /api/v1/ai/chat
 * Server-side proxy for Gemini FitVision Stylist so GEMINI_API_KEY stays off the client bundle.
 */
aiRouter.post('/chat', registerRateLimiter, async (req, res, next) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Nội dung câu hỏi không hợp lệ.');
    }

    const { query: userQuery, locale, hasVerifiedMeasurements, userBody } = parsed.data;

    if (!env.GEMINI_API_KEY) {
      sendSuccess(res, { reply: null, mode: 'fallback' });
      return;
    }

    const biometricSummary =
      hasVerifiedMeasurements && userBody
        ? `- Height: ${userBody.height_cm} cm\n- Weight: ${userBody.weight_kg} kg\n- Chest: ${userBody.chest_cm} cm\n- Waist: ${userBody.waist_cm} cm\n- Hip: ${userBody.hip_cm} cm`
        : 'User has NOT logged in or has not recorded 3D measurements yet. Do NOT invent or assume fake numbers like 172cm/68kg unless user writes them in the question.';

    const promptSystem = `You are FitVision 3D's friendly Style & Sizing Assistant.
Customer Biometrics (ISO 8559-1):
${biometricSummary}
Store Catalog Highlights:
- Áo Sơ Mi Oxford Cotton Ai Cập (590.000đ)
- Áo Blazer Linen Pháp Phom May Đo (1.650.000đ)
- Quần Tây Xếp Ly Đôi Phom Ý (765.000đ)
- Áo Polo Dệt Kim Lụa (520.000đ)
- Đầm Lụa Satin Cổ Đổ (1.250.000đ)
Respond warmly, concisely (under 130 words) in ${
      locale === 'en' ? 'English' : 'Vietnamese'
    }. Do not use bullet asterisks (*). Use **bold** sparingly for sizes and product names.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      env.GEMINI_API_KEY
    )}`;

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${promptSystem}\n\nCustomer question: ${userQuery}` }],
          },
        ],
      }),
    });

    if (!upstream.ok) {
      sendSuccess(res, { reply: null, mode: 'fallback' });
      return;
    }

    const data: any = await upstream.json();
    const replyText: string | null = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    sendSuccess(res, { reply: replyText, mode: replyText ? 'gemini' : 'fallback' });
  } catch (err) {
    next(err);
  }
});
