import { commerceRepository } from '../../commerce/commerce.repository.js';
import {
  COMMON_SECURITY_GUARDRAILS,
  sanitizeUntrusted,
  wrapUntrustedBlock,
} from '../promptSafety.js';
import type { AiBotDefinition, AiChatRequestInput, AiLocale } from './types.js';
import type { TokenPayload } from '../../../utils/jwt.js';

export interface ShopAiContext {
  hasShop: boolean;
  shopName: string;
  isMall: boolean;
  totalProducts: number;
  hiddenProducts: number;
  lowStockItems: Array<{
    productName: string;
    size: string;
    color: string;
    stock: number;
  }>;
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    tailoring: number;
    shipping: number;
    completed: number;
    cancelled: number;
    completedRevenueVnd: number;
  };
  unrepliedReviewsCount: number;
  recentUnrepliedReviews: Array<{
    productName: string;
    rating: number;
    comment: string;
  }>;
}

export const shopBot: AiBotDefinition<ShopAiContext> = {
  id: 'shop',
  access: {
    allowGuest: false,
    // Strictly SHOP_OWNER only — Admin uses dedicated Admin Ops Copilot
    allowedRoles: ['SHOP_OWNER'],
  },
  rateLimit: {
    userPerMin: 25,
  },

  async buildContext(user: TokenPayload | undefined, _input: AiChatRequestInput): Promise<ShopAiContext> {
    if (!user?.sub) {
      return {
        hasShop: false,
        shopName: '',
        isMall: false,
        totalProducts: 0,
        hiddenProducts: 0,
        lowStockItems: [],
        orders: { total: 0, pending: 0, confirmed: 0, tailoring: 0, shipping: 0, completed: 0, cancelled: 0, completedRevenueVnd: 0 },
        unrepliedReviewsCount: 0,
        recentUnrepliedReviews: [],
      };
    }

    const dashboard = await commerceRepository.getShopDashboard(user.sub);
    if (!dashboard?.shop) {
      return {
        hasShop: false,
        shopName: '',
        isMall: false,
        totalProducts: 0,
        hiddenProducts: 0,
        lowStockItems: [],
        orders: { total: 0, pending: 0, confirmed: 0, tailoring: 0, shipping: 0, completed: 0, cancelled: 0, completedRevenueVnd: 0 },
        unrepliedReviewsCount: 0,
        recentUnrepliedReviews: [],
      };
    }

    const products = Array.isArray(dashboard.products) ? dashboard.products : [];
    const orders = Array.isArray(dashboard.orders) ? dashboard.orders : [];
    const reviews = Array.isArray(dashboard.reviews) ? dashboard.reviews : [];

    // Collect low-stock variants (stock <= 3)
    const lowStockItems: ShopAiContext['lowStockItems'] = [];
    let hiddenProducts = 0;
    for (const p of products) {
      if (p.is_hidden) hiddenProducts += 1;
      const variants = Array.isArray(p.variants) ? p.variants : [];
      for (const v of variants) {
        const stock = Number(v.stock ?? 0);
        if (stock <= 3 && lowStockItems.length < 8) {
          lowStockItems.push({
            productName: sanitizeUntrusted(p.name, 70),
            size: sanitizeUntrusted(v.size_label || 'N/A', 12),
            color: sanitizeUntrusted(v.color_name || '', 24),
            stock,
          });
        }
      }
    }

    const orderCounts = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      tailoring: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
      completedRevenueVnd: 0,
    };

    for (const o of orders) {
      const st = String(o.status || 'pending');
      if (st === 'pending') orderCounts.pending += 1;
      else if (st === 'confirmed') orderCounts.confirmed += 1;
      else if (st === 'tailoring') orderCounts.tailoring += 1;
      else if (st === 'shipping') orderCounts.shipping += 1;
      else if (st === 'completed') {
        orderCounts.completed += 1;
        orderCounts.completedRevenueVnd += Number(o.total_amount || 0);
      } else if (st === 'cancelled') orderCounts.cancelled += 1;
    }

    // Strict PII allowlist: NEVER include buyer phone, address, email, or user_id
    const unreplied = reviews.filter((r: any) => !r.shop_reply || !String(r.shop_reply).trim());
    const recentUnrepliedReviews = unreplied.slice(0, 3).map((r: any) => ({
      productName: sanitizeUntrusted(r.product_name, 70),
      rating: Number(r.rating || 5),
      comment: sanitizeUntrusted(r.comment, 140),
    }));

    return {
      hasShop: true,
      shopName: sanitizeUntrusted(dashboard.shop.shop_name, 80),
      isMall: Boolean(dashboard.shop.is_mall),
      totalProducts: products.length,
      hiddenProducts,
      lowStockItems,
      orders: orderCounts,
      unrepliedReviewsCount: unreplied.length,
      recentUnrepliedReviews,
    };
  },

  buildSystemPrompt(ctx: ShopAiContext, locale: AiLocale): string {
    const lang = locale === 'en' ? 'English' : 'Vietnamese';

    const kpiSummary = ctx.hasShop
      ? [
          `Shop: ${ctx.shopName} (Mall: ${ctx.isMall ? 'Yes' : 'No'})`,
          `Products: ${ctx.totalProducts} total (${ctx.hiddenProducts} hidden)`,
          `Orders: ${ctx.orders.total} total | pending=${ctx.orders.pending}, confirmed=${ctx.orders.confirmed}, tailoring=${ctx.orders.tailoring}, shipping=${ctx.orders.shipping}, completed=${ctx.orders.completed}, cancelled=${ctx.orders.cancelled}`,
          `Completed revenue: ${ctx.orders.completedRevenueVnd.toLocaleString('vi-VN')} VND`,
          `Unreplied reviews: ${ctx.unrepliedReviewsCount}`,
        ].join('\n')
      : 'No approved shop profile found for this account yet.';

    const lowStockText =
      ctx.lowStockItems.length > 0
        ? ctx.lowStockItems
            .map((i) => `- ${i.productName} (Size ${i.size}${i.color ? `, ${i.color}` : ''}): stock=${i.stock}`)
            .join('\n')
        : 'All variants have healthy stock (> 3).';

    const reviewText =
      ctx.recentUnrepliedReviews.length > 0
        ? ctx.recentUnrepliedReviews
            .map((r) => `- [${r.rating}/5] ${r.productName}: "${r.comment}"`)
            .join('\n')
        : 'No unreplied reviews.';

    return `You are **FitVision Seller Copilot**, the dedicated operations & merchandising assistant for this approved Shop Owner.
Respond professionally, concisely, and actionably in ${lang}.

ROLE SCOPE (THIS SHOP OWNER ONLY):
- Help optimize product descriptions & SEO keywords, draft polite replies to customer reviews (especially 1–2 star feedback), flag pending/tailoring orders & low-stock variants, and advise on ISO 8559 size charts & bespoke tailoring notes.
- STRICT TENANT ISOLATION: You only see THIS shop's data. Politely refuse any request for competitor shops' data, platform-wide revenue, other users' personal data, or Admin Portal actions.
- READ-ONLY: Draft suggestions only; remind the seller to click the corresponding Save/Reply/Update button in Shop Portal.

${wrapUntrustedBlock('SHOP_KPI_SUMMARY', kpiSummary)}
${wrapUntrustedBlock('LOW_STOCK_VARIANTS', lowStockText)}
${wrapUntrustedBlock('UNREPLIED_REVIEWS', reviewText)}

${COMMON_SECURITY_GUARDRAILS}`;
  },

  buildFallbackReply(ctx: ShopAiContext, query: string, locale: AiLocale): string {
    const isEn = locale === 'en';
    if (!ctx.hasShop) {
      return isEn
        ? 'Your shop profile is not active yet. Please verify your store approval status first.'
        : 'Hồ sơ cửa hàng của bạn chưa được kích hoạt. Vui lòng kiểm tra trạng thái phê duyệt Shop trước nhé.';
    }

    const q = query.toLowerCase();
    if (q.includes('kho') || q.includes('hết hàng') || q.includes('stock')) {
      if (ctx.lowStockItems.length === 0) {
        return isEn
          ? `Great news! All product variants in **${ctx.shopName}** currently have stock > 3.`
          : `Tất cả biến thể sản phẩm của **${ctx.shopName}** hiện đều còn tồn kho an toàn (> 3 sản phẩm).`;
      }
      const list = ctx.lowStockItems
        .slice(0, 5)
        .map((i) => `• **${i.productName}** (Size ${i.size}): còn **${i.stock}**`)
        .join('\n');
      return isEn
        ? `Variants with low stock (≤ 3) in **${ctx.shopName}**:\n${list}`
        : `Các biến thể sắp hết hàng (≤ 3) tại **${ctx.shopName}**:\n${list}`;
    }

    if (q.includes('đánh giá') || q.includes('review')) {
      return isEn
        ? `**${ctx.shopName}** has **${ctx.unrepliedReviewsCount}** unreplied review(s). Tip: thank the buyer, address sizing/fabric concerns empathetically, and offer exchange support if needed.`
        : `**${ctx.shopName}** hiện có **${ctx.unrepliedReviewsCount}** đánh giá chưa phản hồi. Bạn nên cảm ơn khách, giải thích ngắn gọn về chất liệu/phom dáng và chủ động hỗ trợ đổi size nếu khách chưa ưng ý.`;
    }

    return isEn
      ? `**${ctx.shopName}** summary: **${ctx.totalProducts}** products, **${ctx.orders.pending}** pending orders, **${ctx.orders.tailoring}** tailoring orders, **${ctx.lowStockItems.length}** low-stock variants, and **${ctx.unrepliedReviewsCount}** unreplied reviews. Ask me to draft product descriptions or review replies!`
      : `Tóm tắt **${ctx.shopName}**: **${ctx.totalProducts}** sản phẩm, **${ctx.orders.pending}** đơn chờ xác nhận, **${ctx.orders.tailoring}** đơn đang may đo, **${ctx.lowStockItems.length}** biến thể sắp hết kho và **${ctx.unrepliedReviewsCount}** đánh giá chưa trả lời. Bạn muốn mình soạn mô tả sản phẩm hay mẫu phản hồi khách hàng?`;
  },
};
