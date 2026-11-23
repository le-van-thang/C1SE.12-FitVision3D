import { commerceRepository } from '../../commerce/commerce.repository.js';
import { measurementsRepository } from '../../measurements/measurements.repository.js';
import { adminRepository } from '../../admin/admin.repository.js';
import {
  COMMON_SECURITY_GUARDRAILS,
  sanitizeUntrusted,
  wrapUntrustedBlock,
} from '../promptSafety.js';
import type { AiBotDefinition, AiChatRequestInput, AiLocale } from './types.js';
import type { TokenPayload } from '../../../utils/jwt.js';

export interface CustomerAiContext {
  isAuthenticated: boolean;
  measurements: {
    height_cm: number;
    weight_kg: number;
    chest_cm: number;
    waist_cm: number;
    hip_cm: number;
    source: 'db' | 'guest_input';
  } | null;
  recentOrders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    paymentStatus: string;
  }>;
  membership: {
    points: number;
    tier: string;
  } | null;
  pendingShopStatus: string | null;
  catalogHighlights: Array<{
    name: string;
    category: string;
    price: number;
    isBespoke: boolean;
  }>;
}

export const customerBot: AiBotDefinition<CustomerAiContext> = {
  id: 'customer',
  access: {
    allowGuest: true,
    allowedRoles: ['USER', 'SHOP_OWNER', 'ADMIN'],
  },
  rateLimit: {
    guestPerMin: 8,
    userPerMin: 15,
  },

  async buildContext(user: TokenPayload | undefined, input: AiChatRequestInput): Promise<CustomerAiContext> {
    const isAuthenticated = Boolean(user?.sub);

    // 1. Public visible catalog highlights only (never expose hidden products or internal stock)
    let catalogHighlights: CustomerAiContext['catalogHighlights'] = [];
    try {
      const products = await commerceRepository.listProducts(false);
      catalogHighlights = (products || []).slice(0, 8).map((p: any) => ({
        name: sanitizeUntrusted(p.name, 90),
        category: sanitizeUntrusted(p.category, 40),
        price: Number(p.sale_price || p.price || 0),
        isBespoke: Boolean(p.is_bespoke),
      }));
    } catch {
      catalogHighlights = [];
    }

    // 2. For authenticated users, ALWAYS load measurements/orders/membership from DB (never trust client-sent body)
    let measurements: CustomerAiContext['measurements'] = null;
    let recentOrders: CustomerAiContext['recentOrders'] = [];
    let membership: CustomerAiContext['membership'] = null;
    let pendingShopStatus: string | null = null;

    if (isAuthenticated && user?.sub) {
      const [latestMeasure, orders, wallet, myShop] = await Promise.allSettled([
        measurementsRepository.getLatestByUser(user.sub),
        commerceRepository.listOrdersForActor({ sub: user.sub, role: 'USER' }),
        commerceRepository.getMembershipWallet(user.sub),
        adminRepository.getShopByOwnerId(user.sub),
      ]);

      if (latestMeasure.status === 'fulfilled' && latestMeasure.value) {
        const m = latestMeasure.value;
        measurements = {
          height_cm: Number(m.biometric.stature_cm),
          weight_kg: Number(m.biometric.weight_kg),
          chest_cm: Number(m.measurement.chest_circ_cm),
          waist_cm: Number(m.measurement.waist_circ_cm),
          hip_cm: Number(m.measurement.hip_circ_cm),
          source: 'db',
        };
      }

      if (orders.status === 'fulfilled' && Array.isArray(orders.value)) {
        // Strict allowlist: NEVER include recipient phone/address/email
        recentOrders = orders.value.slice(0, 5).map((o: any) => ({
          id: sanitizeUntrusted(o.id, 32),
          status: sanitizeUntrusted(o.status, 24),
          totalAmount: Number(o.total_amount || 0),
          paymentStatus: sanitizeUntrusted(o.payment_status || 'unpaid', 20),
        }));
      }

      if (wallet.status === 'fulfilled' && wallet.value) {
        membership = {
          points: Number(
            (wallet.value as any).availablePoints ??
              (wallet.value as any).points ??
              (wallet.value as any).fitPoints ??
              0
          ),
          tier: sanitizeUntrusted(
            (wallet.value as any).tierId || (wallet.value as any).tier || 'member',
            24
          ),
        };
      }

      if (myShop.status === 'fulfilled' && myShop.value && myShop.value.status !== 'APPROVED') {
        pendingShopStatus = sanitizeUntrusted(myShop.value.status, 24);
      }
    } else if (input.guestBody && input.guestBody.height_cm > 0 && input.guestBody.weight_kg > 0) {
      measurements = {
        height_cm: input.guestBody.height_cm,
        weight_kg: input.guestBody.weight_kg,
        chest_cm: input.guestBody.chest_cm ?? 0,
        waist_cm: input.guestBody.waist_cm ?? 0,
        hip_cm: input.guestBody.hip_cm ?? 0,
        source: 'guest_input',
      };
    }

    return {
      isAuthenticated,
      measurements,
      recentOrders,
      membership,
      pendingShopStatus,
      catalogHighlights,
    };
  },

  buildSystemPrompt(ctx: CustomerAiContext, locale: AiLocale): string {
    const lang = locale === 'en' ? 'English' : 'Vietnamese';

    const measureBlock = ctx.measurements
      ? `Height ${ctx.measurements.height_cm}cm, Weight ${ctx.measurements.weight_kg}kg, Chest ${ctx.measurements.chest_cm}cm, Waist ${ctx.measurements.waist_cm}cm, Hip ${ctx.measurements.hip_cm}cm (source: ${ctx.measurements.source})`
      : ctx.isAuthenticated
        ? 'Authenticated user has not saved 3D measurements yet.'
        : 'Guest visitor (not signed in). Do NOT invent measurements unless they type them.';

    const catalogText =
      ctx.catalogHighlights.length > 0
        ? ctx.catalogHighlights
            .map((p) => `- ${p.name} [${p.category}] (${p.price.toLocaleString('vi-VN')} VND${p.isBespoke ? ', Bespoke' : ''})`)
            .join('\n')
        : '- Oxford Cotton Shirt (590.000 VND)\n- French Linen Blazer (1.650.000 VND)\n- Italian Pleated Trousers (765.000 VND)';

    const ordersText =
      ctx.recentOrders.length > 0
        ? ctx.recentOrders
            .map((o) => `- ${o.id}: status=${o.status}, payment=${o.paymentStatus}, total=${o.totalAmount.toLocaleString('vi-VN')} VND`)
            .join('\n')
        : 'No recent orders.';

    const memberText = ctx.membership
      ? `Tier: ${ctx.membership.tier}, FitPoints: ${ctx.membership.points}`
      : 'Not signed in.';

    const shopAppNote = ctx.pendingShopStatus
      ? `\nNote: This user also has a store onboarding application with status=${ctx.pendingShopStatus}. If asked, explain it is under Admin review.`
      : '';

    return `You are **FitVision Stylist**, the shopping & sizing assistant for FitVision 3D customers.
Respond warmly and concisely in ${lang}.

ROLE SCOPE (CUSTOMER ONLY):
- Help with garment sizing, ISO 8559 ease allowance, outfit pairing, 3D scanning guidance, Freeship policy (free express shipping from 1,000,000 VND), membership points, and checking THIS customer's own order status.
- REFUSE any request about platform revenue, other users' data, internal inventory, seller/admin analytics, or system administration.

${wrapUntrustedBlock('CUSTOMER_BIOMETRICS', measureBlock)}
${wrapUntrustedBlock('CUSTOMER_RECENT_ORDERS', ordersText)}
${wrapUntrustedBlock('CUSTOMER_MEMBERSHIP', memberText)}
${wrapUntrustedBlock('PUBLIC_CATALOG', catalogText)}${shopAppNote}

${COMMON_SECURITY_GUARDRAILS}`;
  },

  buildFallbackReply(ctx: CustomerAiContext, query: string, locale: AiLocale): string {
    const q = query.toLowerCase();
    const isEn = locale === 'en';

    if (q.includes('đơn') || q.includes('order')) {
      if (!ctx.isAuthenticated) {
        return isEn
          ? 'Please **Sign In** to check your personal order status.'
          : 'Bạn vui lòng **Đăng nhập** để mình tra cứu trạng thái đơn hàng của bạn nhé.';
      }
      if (ctx.recentOrders.length === 0) {
        return isEn
          ? 'You do not have any orders yet. Explore the catalog and add items to your Smart Cart!'
          : 'Tài khoản của bạn hiện chưa có đơn hàng nào. Bạn hãy chọn sản phẩm ưng ý trên gian hàng nhé!';
      }
      const lines = ctx.recentOrders
        .slice(0, 3)
        .map((o) => `• **${o.id}**: ${o.status} (${o.totalAmount.toLocaleString('vi-VN')}₫)`)
        .join('\n');
      return isEn
        ? `Here are your latest orders:\n${lines}`
        : `Các đơn hàng gần nhất của bạn:\n${lines}`;
    }

    if (q.includes('doanh thu') || q.includes('admin') || q.includes('audit') || q.includes('revenue')) {
      return isEn
        ? 'I am the Customer Stylist assistant and can only help with sizing, products, and your own orders.'
        : 'Mình là trợ lý **FitVision Stylist** dành cho khách mua sắm nên không có quyền xem doanh thu hay dữ liệu quản trị. Mình có thể hỗ trợ bạn chọn size, phối đồ hoặc kiểm tra đơn hàng của bạn!';
    }

    if (ctx.measurements && ctx.measurements.chest_cm > 0) {
      const chest = ctx.measurements.chest_cm;
      const suggested = chest < 88 ? 'S' : chest < 95 ? 'M' : chest < 102 ? 'L' : 'XL';
      return isEn
        ? `Based on your saved profile (Chest **${chest} cm**, Waist **${ctx.measurements.waist_cm} cm**), I recommend size **${suggested}** for shirts/blazers with comfortable Ease Allowance.`
        : `Dựa trên hồ sơ số đo của bạn (Ngực **${chest} cm**, Eo **${ctx.measurements.waist_cm} cm**), mình gợi ý size **${suggested}** cho áo sơ mi/blazer để đảm bảo độ cử động thoải mái chuẩn ISO 8559.`;
    }

    return isEn
      ? 'I can help you pick the right size, pair outfits, check your orders, or explain our 1,000,000 VND Freeship & 3D Bespoke policy. Share your height & weight or sign in to sync your 3D measurements!'
      : 'Mình có thể tư vấn chọn size, gợi ý phối đồ, kiểm tra đơn hàng của bạn hoặc giải đáp chính sách Freeship từ 1.000.000₫ và đặt may đo 3D. Bạn có thể đăng nhập hoặc nhắn chiều cao, cân nặng để mình tư vấn ngay!';
  },
};
