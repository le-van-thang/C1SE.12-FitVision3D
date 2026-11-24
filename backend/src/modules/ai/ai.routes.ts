import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../../middlewares/authGuard.js';
import { enforceAiRateLimit } from '../../middlewares/aiRateLimiter.js';
import { AppError, sendSuccess } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';
import { checkBotAccess, getAiBot } from './bots/registry.js';
import { generateLlmReply } from './llmClient.js';

export const aiRouter = Router();

const historyTurnSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string().trim().min(1).max(1000),
});

const chatBodySchema = z.object({
  query: z.string().trim().min(1).max(1000),
  locale: z.enum(['vi', 'en']).default('vi'),
  history: z.array(historyTurnSchema).max(6).optional().default([]),
  // Only used by customer bot when actor is an unauthenticated Guest
  guestBody: z
    .object({
      height_cm: z.number().min(80).max(250),
      weight_kg: z.number().min(20).max(300),
      chest_cm: z.number().min(40).max(200).optional(),
      waist_cm: z.number().min(40).max(200).optional(),
      hip_cm: z.number().min(40).max(200).optional(),
    })
    .nullable()
    .optional(),
});

async function handleBotChat(
  rawBotId: string,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bot = getAiBot(rawBotId);
    if (!bot) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy trợ lý AI yêu cầu.');
    }

    // 1. Server-side RBAC check based strictly on verified JWT (req.user)
    const access = checkBotAccess(bot, req.user);
    if (!access.allowed) {
      throw new AppError(
        access.status || 403,
        access.status === 401
          ? ErrorCode.AUTH_UNAUTHORIZED
          : ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
        access.message || 'Không có quyền truy cập trợ lý AI này.'
      );
    }

    // 2. Dedicated per-bot AI rate limit (completely isolated from auth registerRateLimiter)
    enforceAiRateLimit(req, res, {
      bucket: `ai:${bot.id}`,
      guestPerMin: bot.rateLimit.guestPerMin,
      userPerMin: bot.rateLimit.userPerMin,
    });

    // 3. Validate input payload
    const parsed = chatBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Nội dung câu hỏi hoặc lịch sử hội thoại không hợp lệ.');
    }

    const input = {
      query: parsed.data.query,
      locale: parsed.data.locale,
      history: parsed.data.history,
      guestBody: parsed.data.guestBody ?? null,
    };

    // 4. Build role-scoped DB context & isolated system prompt
    const ctx = await bot.buildContext(req.user, input);
    const systemInstruction = bot.buildSystemPrompt(ctx, input.locale);

    // 5. Call Gemini via header-auth + timeout client; fall back gracefully to domain reply
    const llmReply = await generateLlmReply({
      systemInstruction,
      history: input.history,
      userQuery: input.query,
    });

    const reply = llmReply || bot.buildFallbackReply(ctx, input.query, input.locale);
    sendSuccess(res, {
      botId: bot.id,
      reply,
      mode: llmReply ? 'gemini' : 'fallback',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Role-isolated AI Assistant endpoints:
 * - POST /api/v1/ai/customer/chat (Guest & authenticated buyers)
 * - POST /api/v1/ai/shop/chat     (SHOP_OWNER only)
 * - POST /api/v1/ai/admin/chat    (ADMIN only)
 */
aiRouter.post('/:botId/chat', optionalAuth, (req, res, next) => {
  const botId = Array.isArray(req.params.botId) ? req.params.botId[0] : req.params.botId;
  void handleBotChat(botId, req, res, next);
});

/**
 * Backward-compatible alias for legacy customer widget calls
 */
aiRouter.post('/chat', optionalAuth, (req, res, next) => {
  void handleBotChat('customer', req, res, next);
});
