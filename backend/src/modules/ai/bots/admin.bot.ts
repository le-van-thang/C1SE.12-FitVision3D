import { adminRepository } from '../../admin/admin.repository.js';
import { commerceRepository } from '../../commerce/commerce.repository.js';
import {
  COMMON_SECURITY_GUARDRAILS,
  sanitizeUntrusted,
  wrapUntrustedBlock,
} from '../promptSafety.js';
import type { AiBotDefinition, AiChatRequestInput, AiLocale } from './types.js';
import type { TokenPayload } from '../../../utils/jwt.js';

export interface AdminAiContext {
  stats: {
    totalUsers: number;
    totalStores: number;
    pendingStores: number;
    approvedStores: number;
    rejectedStores: number;
    totalMeasurements: number;
  };
  pendingShops: Array<{
    shopName: string;
    createdAt: string;
  }>;
  activeVouchers: Array<{
    code: string;
    discountType: string;
    discountValue: number;
  }>;
  recentAuditActions: Array<{
    action: string;
    targetType: string;
    createdAt: string;
  }>;
}

export const adminBot: AiBotDefinition<AdminAiContext> = {
  id: 'admin',
  access: {
    allowGuest: false,
    allowedRoles: ['ADMIN'],
  },
  rateLimit: {
    userPerMin: 40,
  },

  async buildContext(_user: TokenPayload | undefined, _input: AiChatRequestInput): Promise<AdminAiContext> {
    const [statsRes, shopsRes, vouchersRes, logsRes] = await Promise.allSettled([
      adminRepository.getStats(),
      adminRepository.getAllShops(),
      commerceRepository.listVouchers(),
      adminRepository.getAuditLogs(10),
    ]);

    const stats =
      statsRes.status === 'fulfilled' && statsRes.value
        ? {
            totalUsers: Number(statsRes.value.totalUsers || 0),
            totalStores: Number(statsRes.value.totalStores || 0),
            pendingStores: Number(statsRes.value.pendingStores || 0),
            approvedStores: Number(statsRes.value.approvedStores || 0),
            rejectedStores: Number(statsRes.value.rejectedStores || 0),
            totalMeasurements: Number(statsRes.value.totalMeasurements || 0),
          }
        : {
            totalUsers: 0,
            totalStores: 0,
            pendingStores: 0,
            approvedStores: 0,
            rejectedStores: 0,
            totalMeasurements: 0,
          };

    // Strict allowlist: NO owner phone, email, address, or tax code
    const pendingShops =
      shopsRes.status === 'fulfilled' && Array.isArray(shopsRes.value)
        ? shopsRes.value
            .filter((s: any) => s.status === 'PENDING')
            .slice(0, 8)
            .map((s: any) => ({
              shopName: sanitizeUntrusted(s.shop_name || s.brandName, 70),
              createdAt: sanitizeUntrusted(s.created_at || '', 24),
            }))
        : [];

    const activeVouchers =
      vouchersRes.status === 'fulfilled' && Array.isArray(vouchersRes.value)
        ? vouchersRes.value
            .filter((v: any) => v.active !== false && v.is_active !== false)
            .slice(0, 8)
            .map((v: any) => ({
              code: sanitizeUntrusted(v.code, 30),
              discountType: sanitizeUntrusted(v.discountType || v.discount_type || 'fixed', 16),
              discountValue: Number(v.discountValue ?? v.discount_value ?? 0),
            }))
        : [];

    // Strict allowlist: NO IP address, metadata, emails, or tokens
    const recentAuditActions =
      logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)
        ? logsRes.value.slice(0, 10).map((l: any) => ({
            action: sanitizeUntrusted(l.action_type || l.action || l.event_type, 50),
            targetType: sanitizeUntrusted(
              l.target_type || l.entity_type || (l.measurement_id ? 'measurement' : 'system'),
              32
            ),
            createdAt: sanitizeUntrusted(l.created_at || '', 24),
          }))
        : [];

    return {
      stats,
      pendingShops,
      activeVouchers,
      recentAuditActions,
    };
  },

  buildSystemPrompt(ctx: AdminAiContext, locale: AiLocale): string {
    const lang = locale === 'en' ? 'English' : 'Vietnamese';

    const kpiText = [
      `Total Users: ${ctx.stats.totalUsers}`,
      `Total Stores: ${ctx.stats.totalStores} (PENDING=${ctx.stats.pendingStores}, APPROVED=${ctx.stats.approvedStores}, REJECTED=${ctx.stats.rejectedStores})`,
      `Total 3D Measurements Saved: ${ctx.stats.totalMeasurements}`,
    ].join('\n');

    const pendingText =
      ctx.pendingShops.length > 0
        ? ctx.pendingShops.map((s) => `- ${s.shopName} (submitted: ${s.createdAt})`).join('\n')
        : 'No shops pending approval.';

    const voucherText =
      ctx.activeVouchers.length > 0
        ? ctx.activeVouchers
            .map((v) => `- ${v.code}: ${v.discountType === 'percent' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString('vi-VN')} VND`}`)
            .join('\n')
        : 'No active vouchers.';

    const auditText =
      ctx.recentAuditActions.length > 0
        ? ctx.recentAuditActions
            .map((a) => `- [${a.createdAt}] ${a.action} (${a.targetType})`)
            .join('\n')
        : 'No recent audit events.';

    return `You are **FitVision Admin Ops Copilot**, an executive read-only operations advisor for FitVision 3D platform administrators.
Respond crisply, objectively, and structurally in ${lang}.

ROLE SCOPE (PLATFORM ADMIN ONLY):
- Summarize platform health KPIs, pending store approvals, active vouchers, and recent audit activity.
- Draft professional, policy-aligned store rejection reasons, catalog moderation notices, and promotional campaign ideas.
- HUMAN-IN-THE-LOOP SAFETY: You are strictly READ-ONLY. Never claim you executed an approval, rejection, user lock, role downgrade, or voucher deletion. Always direct the Admin to the exact tab in Admin Portal (STORES, USERS, CATALOG, CMS, AUDIT) to confirm manually.
- PRIVACY: Never output raw credentials, hashes, tokens, API keys, or bulk personal contact details.

${wrapUntrustedBlock('PLATFORM_KPIS', kpiText)}
${wrapUntrustedBlock('PENDING_SHOPS', pendingText)}
${wrapUntrustedBlock('ACTIVE_VOUCHERS', voucherText)}
${wrapUntrustedBlock('RECENT_AUDIT_EVENTS', auditText)}

${COMMON_SECURITY_GUARDRAILS}`;
  },

  buildFallbackReply(ctx: AdminAiContext, query: string, locale: AiLocale): string {
    const isEn = locale === 'en';
    const q = query.toLowerCase();

    if (q.includes('duyệt') || q.includes('pending') || q.includes('shop')) {
      if (ctx.pendingShops.length === 0) {
        return isEn
          ? 'There are currently **0** pending store applications.'
          : 'Hiện tại không có hồ sơ cửa hàng nào đang chờ duyệt (`PENDING = 0`).';
      }
      const list = ctx.pendingShops.map((s) => `• **${s.shopName}**`).join('\n');
      return isEn
        ? `There are **${ctx.stats.pendingStores}** pending store(s):\n${list}\nOpen the **STORES** tab to review and approve/reject manually.`
        : `Hiện có **${ctx.stats.pendingStores}** hồ sơ cửa hàng đang chờ duyệt:\n${list}\nBạn mở tab **Duyệt Shop (STORES)** để xem minh chứng và thao tác phê duyệt/từ chối trực tiếp.`;
    }

    if (q.includes('từ chối') || q.includes('reject')) {
      return isEn
        ? 'Suggested rejection template: "Your store application could not be approved because the business license image is unclear or business address details are incomplete. Please re-submit with clear documents."'
        : 'Mẫu lý do từ chối chuẩn: "Hồ sơ đăng ký cửa hàng chưa đạt yêu cầu do ảnh giấy phép kinh doanh chưa rõ nét hoặc địa chỉ kinh doanh chưa đầy đủ. Vui lòng bổ sung chứng từ hợp lệ và gửi lại hồ sơ."';
    }

    return isEn
      ? `Platform snapshot: **${ctx.stats.totalUsers}** users, **${ctx.stats.approvedStores}** approved stores (**${ctx.stats.pendingStores}** pending), **${ctx.activeVouchers.length}** active vouchers, and **${ctx.recentAuditActions.length}** recent audit events. Note: I operate in read-only advisory mode.`
      : `Tổng quan sàn FitVision 3D: **${ctx.stats.totalUsers}** người dùng, **${ctx.stats.approvedStores}** shop đang hoạt động (**${ctx.stats.pendingStores}** shop chờ duyệt), **${ctx.activeVouchers.length}** voucher đang bật và **${ctx.recentAuditActions.length}** sự kiện nhật ký gần nhất. Mình hoạt động ở chế độ tư vấn **chỉ đọc (read-only)**.`;
  },
};
