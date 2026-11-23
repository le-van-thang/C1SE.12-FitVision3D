export type AiBotId = 'customer' | 'shop' | 'admin';

export interface BotQuickPrompt {
  label: string;
  query: string;
}

export interface BotUiProfile {
  id: AiBotId;
  badgeText: string;
  gradientFrom: string;
  gradientTo: string;
  capFrom: string;
  capTo: string;
  accentTextClass: string;
  bubbleBgClass: string;
  sendBtnClass: string;
  chipHoverClass: string;
  inputFocusClass: string;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  heroTaglineVi: string;
  heroTaglineEn: string;
  greetingVi: string;
  greetingEn: string;
  placeholderVi: string;
  placeholderEn: string;
  thinkingVi: string;
  thinkingEn: string;
  floatingHintsVi: string[];
  floatingHintsEn: string[];
  quickPromptsVi: BotQuickPrompt[];
  quickPromptsEn: BotQuickPrompt[];
}

export const BOT_UI_PROFILES: Record<AiBotId, BotUiProfile> = {
  customer: {
    id: 'customer',
    badgeText: '3D',
    gradientFrom: '#2563EB',
    gradientTo: '#1E3A8A',
    capFrom: '#60A5FA',
    capTo: '#2563EB',
    accentTextClass: 'text-blue-600',
    bubbleBgClass: 'bg-blue-600',
    sendBtnClass: 'bg-blue-600 hover:bg-blue-700',
    chipHoverClass: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300',
    inputFocusClass: 'focus-within:border-blue-500 focus-within:ring-blue-500/15',
    titleVi: 'FitVision Stylist',
    titleEn: 'FitVision Stylist',
    subtitleVi: 'Tư vấn size & mua sắm · Trực tuyến',
    subtitleEn: 'Sizing & Shopping · Online',
    heroTaglineVi: 'Mình giúp bạn chọn size chuẩn và phối đồ phù hợp',
    heroTaglineEn: 'I help you choose the right tailored size & outfit',
    greetingVi: 'Dạ em có thể giúp gì cho anh/chị hôm nay ạ?',
    greetingEn: 'Hello! How may I help you pick your size today?',
    placeholderVi: 'Nhắn cho FitVision Stylist...',
    placeholderEn: 'Message FitVision Stylist...',
    thinkingVi: 'Đang kiểm tra thông số...',
    thinkingEn: 'Checking fit details...',
    floatingHintsVi: [
      'Gợi ý size sơ mi vừa vặn',
      'Tư vấn phối đồ công sở 3D',
      'Kiểm tra trạng thái đơn hàng của tôi',
    ],
    floatingHintsEn: [
      'Find my exact shirt size',
      'Blazer Linen fit advice',
      'Check my recent order status',
    ],
    quickPromptsVi: [
      { label: 'Tư vấn size của tôi', query: 'Hãy tư vấn size áo sơ mi, blazer và quần vừa vặn nhất theo hồ sơ của tôi.' },
      { label: 'Đơn hàng của tôi', query: 'Kiểm tra trạng thái các đơn hàng gần nhất của tôi.' },
      { label: 'Phối đồ công sở', query: 'Gợi ý cách phối đồ lịch lãm giữa Áo Sơ Mi Oxford và Quần Tây Ý.' },
    ],
    quickPromptsEn: [
      { label: 'Recommend my size', query: 'Recommend the best shirt, blazer, and trouser size based on my profile.' },
      { label: 'My orders', query: 'Check the status of my recent orders.' },
      { label: 'Outfit pairing', query: 'Suggest a smart-casual outfit pairing from FitVision.' },
    ],
  },

  shop: {
    id: 'shop',
    badgeText: 'SHOP',
    gradientFrom: '#0D9488',
    gradientTo: '#115E59',
    capFrom: '#2DD4BF',
    capTo: '#0D9488',
    accentTextClass: 'text-teal-600',
    bubbleBgClass: 'bg-teal-600',
    sendBtnClass: 'bg-teal-600 hover:bg-teal-700',
    chipHoverClass: 'hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300',
    inputFocusClass: 'focus-within:border-teal-500 focus-within:ring-teal-500/15',
    titleVi: 'Seller Copilot',
    titleEn: 'Seller Copilot',
    subtitleVi: 'Trợ lý vận hành Shop · Chỉ đọc',
    subtitleEn: 'Shop Operations · Read-only',
    heroTaglineVi: 'Hỗ trợ tồn kho, mô tả sản phẩm và phản hồi đánh giá cho Shop của bạn',
    heroTaglineEn: 'Inventory alerts, product copywriting & review reply assistant',
    greetingVi: 'Chào Chủ Shop! Mình đã đồng bộ số liệu riêng của cửa hàng bạn. Bạn cần hỗ trợ gì hôm nay?',
    greetingEn: 'Hello Shop Owner! Your store metrics are synced. How can I assist your operations today?',
    placeholderVi: 'Hỏi về tồn kho, mô tả SP, trả lời đánh giá...',
    placeholderEn: 'Ask about stock, product copy, review replies...',
    thinkingVi: 'Đang phân tích dữ liệu Shop...',
    thinkingEn: 'Analyzing your shop data...',
    floatingHintsVi: [
      'Kiểm tra sản phẩm sắp hết kho',
      'Gợi ý trả lời đánh giá khách hàng',
      'Soạn mô tả sản phẩm chuẩn SEO',
    ],
    floatingHintsEn: [
      'Check low-stock variants',
      'Draft customer review replies',
      'Write SEO product descriptions',
    ],
    quickPromptsVi: [
      { label: 'SP sắp hết kho', query: 'Liệt kê các biến thể sản phẩm đang sắp hết tồn kho (<= 3) tại shop của tôi.' },
      { label: 'Mẫu trả lời đánh giá', query: 'Gợi ý mẫu trả lời lịch sự cho các đánh giá khách hàng chưa phản hồi tại shop.' },
      { label: 'Tóm tắt vận hành Shop', query: 'Tóm tắt nhanh tình hình đơn hàng chờ xác nhận, đơn may đo và tồn kho hôm nay của shop.' },
    ],
    quickPromptsEn: [
      { label: 'Low-stock alerts', query: 'List product variants with low stock (<= 3) in my shop.' },
      { label: 'Review reply drafts', query: 'Draft polite responses for unreplied customer reviews in my shop.' },
      { label: 'Shop daily summary', query: 'Summarize my pending orders, tailoring orders, and inventory status.' },
    ],
  },

  admin: {
    id: 'admin',
    badgeText: 'OPS',
    gradientFrom: '#1E293B',
    gradientTo: '#0F172A',
    capFrom: '#F59E0B',
    capTo: '#D97706',
    accentTextClass: 'text-amber-600',
    bubbleBgClass: 'bg-slate-900',
    sendBtnClass: 'bg-slate-900 hover:bg-slate-800',
    chipHoverClass: 'hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300',
    inputFocusClass: 'focus-within:border-amber-500 focus-within:ring-amber-500/15',
    titleVi: 'Admin Ops Copilot',
    titleEn: 'Admin Ops Copilot',
    subtitleVi: 'Cố vấn vận hành sàn · Chỉ đọc (Read-only)',
    subtitleEn: 'Platform Advisor · Read-only',
    heroTaglineVi: 'Tổng hợp KPI toàn sàn, hồ sơ chờ duyệt và soạn mẫu kiểm duyệt',
    heroTaglineEn: 'Platform KPIs, pending store reviews & moderation templates',
    greetingVi: 'Chào Quản trị viên! Mình hoạt động ở chế độ tư vấn chỉ đọc (Read-only) để hỗ trợ bạn giám sát toàn sàn.',
    greetingEn: 'Hello Administrator! I operate in read-only advisory mode to assist your platform operations.',
    placeholderVi: 'Hỏi KPI sàn, shop chờ duyệt, mẫu từ chối...',
    placeholderEn: 'Ask platform KPIs, pending shops, moderation...',
    thinkingVi: 'Đang tổng hợp dữ liệu toàn sàn...',
    thinkingEn: 'Summarizing platform metrics...',
    floatingHintsVi: [
      'Tổng quan KPI toàn sàn hôm nay',
      'Danh sách Shop đang chờ duyệt',
      'Soạn mẫu lý do từ chối hồ sơ Shop',
    ],
    floatingHintsEn: [
      'Platform KPI overview',
      'Pending shop applications',
      'Draft store rejection template',
    ],
    quickPromptsVi: [
      { label: 'KPI toàn sàn', query: 'Tóm tắt nhanh chỉ số KPI toàn sàn: người dùng, shop hoạt động, shop chờ duyệt và voucher.' },
      { label: 'Shop chờ duyệt', query: 'Hiện có những hồ sơ cửa hàng nào đang ở trạng thái PENDING chờ duyệt?' },
      { label: 'Mẫu từ chối Shop', query: 'Soạn mẫu lý do từ chối hồ sơ đăng ký cửa hàng chuyên nghiệp khi thiếu giấy phép rõ nét.' },
    ],
    quickPromptsEn: [
      { label: 'Platform KPIs', query: 'Summarize current platform KPIs: users, approved/pending stores, and active vouchers.' },
      { label: 'Pending stores', query: 'Which store applications are currently PENDING approval?' },
      { label: 'Rejection template', query: 'Draft a professional rejection reason for an incomplete store application.' },
    ],
  },
};
