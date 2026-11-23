import type { AiBotAccessPolicy, AiBotId, UserRoleCode } from './types.js';

export interface AccessActor {
  sub: string;
  role: UserRoleCode;
}

export interface BotAccessCheckResult {
  allowed: boolean;
  status?: 401 | 403;
  message?: string;
}

export const BOT_ACCESS_POLICIES: Record<AiBotId, AiBotAccessPolicy> = {
  customer: {
    allowGuest: true,
    allowedRoles: ['USER', 'SHOP_OWNER', 'ADMIN'],
  },
  shop: {
    allowGuest: false,
    // Strictly SHOP_OWNER only — Admin uses dedicated Admin Ops Copilot
    allowedRoles: ['SHOP_OWNER'],
  },
  admin: {
    allowGuest: false,
    allowedRoles: ['ADMIN'],
  },
};

/**
 * Pure server-side RBAC authorization check for any registered AI bot.
 * Never trusts any role or scope sent from the client payload.
 */
export function checkBotAccessPolicy(
  policy: AiBotAccessPolicy,
  actor: AccessActor | undefined
): BotAccessCheckResult {
  if (!actor) {
    if (policy.allowGuest) {
      return { allowed: true };
    }
    return {
      allowed: false,
      status: 401,
      message: 'Vui lòng đăng nhập để sử dụng trợ lý AI dành cho vai trò này.',
    };
  }

  if (!policy.allowedRoles.includes(actor.role)) {
    return {
      allowed: false,
      status: 403,
      message: 'Tài khoản của bạn không có quyền truy cập trợ lý AI này.',
    };
  }

  return { allowed: true };
}
