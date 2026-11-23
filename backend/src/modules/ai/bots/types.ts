import type { TokenPayload } from '../../../utils/jwt.js';

export type AiBotId = 'customer' | 'shop' | 'admin';
export type AiLocale = 'vi' | 'en';
export type UserRoleCode = 'USER' | 'SHOP_OWNER' | 'ADMIN';

export interface AiChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface GuestBodyInput {
  height_cm: number;
  weight_kg: number;
  chest_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
}

export interface AiChatRequestInput {
  query: string;
  locale: AiLocale;
  history: AiChatHistoryItem[];
  guestBody?: GuestBodyInput | null;
}

export interface AiBotAccessPolicy {
  allowGuest: boolean;
  allowedRoles: UserRoleCode[];
}

export interface AiBotDefinition<TCtx = unknown> {
  id: AiBotId;
  access: AiBotAccessPolicy;
  rateLimit: {
    guestPerMin?: number;
    userPerMin: number;
  };
  buildContext(user: TokenPayload | undefined, input: AiChatRequestInput): Promise<TCtx>;
  buildSystemPrompt(ctx: TCtx, locale: AiLocale): string;
  buildFallbackReply(ctx: TCtx, query: string, locale: AiLocale): string;
}
