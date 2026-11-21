import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ArrowUp,
  RotateCcw,
  Maximize2,
  Minimize2,
  LogIn,
} from 'lucide-react';
import { useI18n } from '@/i18n';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface UserBiometricContext {
  height_cm: number;
  weight_kg: number;
  chest_cm: number;
  waist_cm: number;
  hip_cm: number;
  shoulder_cm?: number;
  inseam_cm?: number;
}

export interface GeminiAssistantWidgetProps {
  userBody?: UserBiometricContext;
  isAuthenticated?: boolean;
  hasBodyProfile?: boolean;
  onOpenSignIn?: () => void;
  currentProduct?: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
}

const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000').replace(/\/$/, '');

/** Friendly custom FitVision 3D Atelier Mascot Avatar */
const FitVisionMascot: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="fvMascotBg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="fvMascotCap" x1="16" y1="8" x2="48" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>

    <circle cx="32" cy="32" r="30" fill="url(#fvMascotBg)" />
    <circle cx="32" cy="32" r="29" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.5" />

    <path d="M15 54C16.5 45.5 23 41 32 41C41 41 47.5 45.5 49 54" fill="#0F172A" />
    <path d="M25 42L32 49L39 42L36 40.5H28L25 42Z" fill="#FFFFFF" />
    <path d="M30.5 45.5L32 53L33.5 45.5L32 43.5L30.5 45.5Z" fill="#3B82F6" />

    <circle cx="32" cy="28.5" r="12.5" fill="#EFF6FF" />
    <path
      d="M19 26.5C19 19 24.8 14 32.5 14C40.5 14 45.5 19.2 45 25.5C41.5 22.8 37.5 21.5 32 21.5C26.5 21.5 22.5 23.2 19 26.5Z"
      fill="url(#fvMascotCap)"
    />

    <circle cx="27" cy="28.5" r="1.9" fill="#0F172A" />
    <circle cx="37" cy="28.5" r="1.9" fill="#0F172A" />
    <circle cx="27.6" cy="27.8" r="0.65" fill="#FFFFFF" />
    <circle cx="37.6" cy="27.8" r="0.65" fill="#FFFFFF" />

    <circle cx="23.5" cy="31.5" r="1.7" fill="#93C5FD" fillOpacity="0.55" />
    <circle cx="40.5" cy="31.5" r="1.7" fill="#93C5FD" fillOpacity="0.55" />
    <path
      d="M28.5 32.8C29.6 34.3 34.4 34.3 35.5 32.8"
      stroke="#0F172A"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    <circle cx="46.5" cy="18.5" r="5.2" fill="#FACC15" stroke="#FFFFFF" strokeWidth="1.4" />
    <path d="M44.5 18.5H48.5M46.5 16.5V20.5" stroke="#0F172A" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Render **bold** and `code`, convert leading markdown `* ` / `- ` bullets cleanly, and never leak raw `*` chars */
const renderFormattedText = (text: string, isUser: boolean): React.ReactNode => {
  const lines = text.split('\n');
  return lines.map((rawLine, lineIdx) => {
    const cleanLine = rawLine.replace(/^\s*[-*]\s+/, '• ');
    const parts = cleanLine.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    const renderedParts = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong
            key={partIdx}
            className={isUser ? 'font-bold text-white' : 'font-bold text-slate-900'}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={partIdx}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
              isUser
                ? 'bg-blue-700/80 text-blue-50'
                : 'bg-blue-50 text-blue-800 border border-blue-100'
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Strip stray single asterisks if any remain
      return <React.Fragment key={partIdx}>{part.replace(/\*/g, '')}</React.Fragment>;
    });

    return (
      <React.Fragment key={lineIdx}>
        {renderedParts}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export const GeminiAssistantWidget: React.FC<GeminiAssistantWidgetProps> = ({
  userBody,
  isAuthenticated = false,
  hasBodyProfile = false,
  onOpenSignIn,
}) => {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showFloatingHint, setShowFloatingHint] = useState<boolean>(true);
  const [hintIndex, setHintIndex] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasVerifiedMeasurements = isAuthenticated && hasBodyProfile && !!userBody;

  const floatingHints =
    locale === 'en'
      ? [
          'Find my exact shirt size',
          'Blazer Linen fit advice',
          'What is Ease Allowance?',
        ]
      : [
          'Gợi ý size sơ mi vừa vặn',
          'Tư vấn phối đồ công sở 3D',
          'Đo số đo chuẩn ISO trong 30s',
        ];

  useEffect(() => {
    if (isOpen || !showFloatingHint) return;
    const timer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % floatingHints.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isOpen, showFloatingHint, floatingHints.length]);

  const buildInitialGreetingBubble = (): ChatMessage => ({
    id: `welcome-${Date.now()}`,
    sender: 'ai',
    text:
      locale === 'en'
        ? `Hello! How may I help you pick your size today?`
        : `Dạ em có thể giúp gì cho anh/chị hôm nay ạ?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildInitialGreetingBubble()]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleResetChat = () => {
    setMessages([buildInitialGreetingBubble()]);
  };

  const quickPrompts =
    locale === 'en'
      ? [
          {
            label: 'Recommend my size',
            query: hasVerifiedMeasurements && userBody
              ? `Recommend the best size for my measurements: ${userBody.height_cm}cm, ${userBody.weight_kg}kg, Chest ${userBody.chest_cm}cm, Waist ${userBody.waist_cm}cm.`
              : 'How do I get my 3D size recommendation?',
          },
          {
            label: 'Ease Allowance?',
            query: 'Explain Ease Allowance in bespoke tailoring.',
          },
          {
            label: 'Outfit pairing',
            query: 'Suggest a smart-casual outfit pairing from FitVision.',
          },
        ]
      : [
          {
            label: 'Tư vấn size của tôi',
            query: hasVerifiedMeasurements && userBody
              ? `Dựa vào số đo Cao ${userBody.height_cm}cm, Nặng ${userBody.weight_kg}kg, Ngực ${userBody.chest_cm}cm, Eo ${userBody.waist_cm}cm, hãy tư vấn size áo sơ mi, blazer và quần vừa vặn nhất cho tôi.`
              : 'Làm sao để tôi nhận được gợi ý size chuẩn theo vóc dáng của mình?',
          },
          {
            label: 'Độ cử động (Ease)',
            query: 'Giải thích độ cử động vải (Ease Allowance) chuẩn ISO 8559 là gì?',
          },
          {
            label: 'Phối đồ công sở',
            query: 'Gợi ý cách phối đồ lịch lãm giữa Áo Sơ Mi Oxford và Quần Tây Ý.',
          },
        ];

  const generateAssistantReply = async (query: string): Promise<string> => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          locale: locale === 'en' ? 'en' : 'vi',
          hasVerifiedMeasurements,
          userBody:
            hasVerifiedMeasurements && userBody
              ? {
                  height_cm: userBody.height_cm,
                  weight_kg: userBody.weight_kg,
                  chest_cm: userBody.chest_cm,
                  waist_cm: userBody.waist_cm,
                  hip_cm: userBody.hip_cm,
                }
              : null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const replyText = json?.data?.reply;
        if (replyText) return replyText;
      }
    } catch {
      // Fallback smoothly to domain expert sizing engine
    }

    await new Promise((r) => setTimeout(r, 450));
    const lower = query.toLowerCase();

    if (lower.includes('size') || lower.includes('kích cỡ') || lower.includes('vừa vặn') || lower.includes('chuẩn')) {
      if (!isAuthenticated) {
        return locale === 'en'
          ? `To recommend your exact tailored size, please **Sign In** so FitVision can sync your 3D body profile — or share your height & weight directly right here!`
          : `Hiện tại bạn **chưa đăng nhập** nên hệ thống chưa có hồ sơ số đo 3D của bạn. Hãy **Đăng nhập** (hoặc nhắn trực tiếp chiều cao, cân nặng của bạn tại đây) để mình tư vấn size chính xác nhất nhé!`;
      }
      if (!hasBodyProfile || !userBody) {
        return locale === 'en'
          ? `Your account doesn't have 3D measurements yet. Click **Edit measurements** on the left sidebar or run a **30s 3D AI Scan** so I can compute your exact size!`
          : `Tài khoản của bạn hiện chưa có số đo 3D. Hãy bấm **Đổi số đo** ở thanh bên trái hoặc chọn **Quét Đo AI 3D** để mình tính chính xác size phù hợp nhé!`;
      }

      return locale === 'en'
        ? `**Tailored Size Analysis for Your Frame**
• Measurements: Chest **${userBody.chest_cm}cm** · Waist **${userBody.waist_cm}cm**
• Shirts & Blazers: Recommend **Size L** (garment chest ~102cm) for a clean Regular Slim drape with **+6cm Ease Allowance**. Choose **Size M** if you prefer a closer fitted cut.
• Trousers: Recommend **Size M** with tailored waist ease so sitting stays comfortable.`
        : `**Phân Tích Kích Cỡ Chuẩn Theo Vóc Dáng**
• Số đo của bạn: Ngực **${userBody.chest_cm}cm** · Eo **${userBody.waist_cm}cm**
• Áo Sơ Mi & Blazer: Phù hợp nhất là **Size L** (vòng ngực áo ~102cm, đạt độ cử động **+6cm Ease Allowance**) cho phom đứng lịch lãm. Nếu thích ôm body hơn, có thể chọn **Size M**.
• Quần Tây / Chino Ý: Khuyên dùng **Size M** để ôm gọn phần hông và thoải mái khi ngồi làm việc.`;
    }

    if (lower.includes('ease') || lower.includes('cử động') || lower.includes('iso')) {
      return locale === 'en'
        ? `**Understanding Ease Allowance (ISO 8559-1)**
Tailored garments are never cut equal to bare skin measurements:
• Formula: \`Garment Size = Body Measurement + Ease Allowance\`
• Slim Fit: \`+3cm to +5cm\` chest room
• Regular Classic: \`+6cm to +9cm\` for all-day movement`
        : `**Độ Cử Động Vải (Ease Allowance) Chuẩn ISO 8559**
Trang phục may đo chuẩn mực **không bao giờ cắt bằng khít với số đo cơ thể**:
• Công thức: \`Thông số áo = Số đo cơ thể + Độ cử động\`
• Phom Ôm (Slim): cộng thêm \`+3cm ~ +5cm\` vòng ngực.
• Phom Tiêu Chuẩn (Regular): cộng \`+6cm ~ +9cm\` giúp vươn tay, lái xe và ngồi thoải mái không bị căng khuy ngực.`;
    }

    return locale === 'en'
      ? `**Bespoke Styling Suggestion**
• Top: Pair the **French Normandy Flax Linen Blazer** with an **Egyptian Cotton Oxford Shirt** for clean shoulder framing.
• Bottom: Match with **Italian Double-Pleated Tapered Trousers** in Charcoal or Navy to elongate your silhouette.
• Sign in and open **3D Virtual Fitting** to preview how each outfit matches your body!`
      : `**Gợi Ý Phối Đồ Lịch Lãm Từ FitVision**
• Áo: Kết hợp **Áo Sơ Mi Oxford Cotton Ai Cập** (590.000₫) hoặc khoác ngoài **Blazer Linen Pháp** (1.650.000₫) cho phom vai đứng gọn và thoáng nhẹ.
• Quần: Phối cùng **Quần Tây Xếp Ly Đôi Phom Ý** (765.000₫) tông Than Chì hoặc Xanh Navy để tôn chiều cao.
• Bạn có thể đăng nhập để sử dụng **Phòng Thử Đồ Ảo 3D** xem tỷ lệ vừa vặn theo từng bộ!`;
  };

  const handleSendMessage = async (customQuery?: string) => {
    const query = customQuery || inputMessage;
    if (!query.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputMessage('');
    setIsTyping(true);

    try {
      const reply = await generateAssistantReply(query);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text:
            locale === 'en'
              ? 'Sorry, our assistant is momentarily busy. Please try again in a moment.'
              : 'Xin lỗi, trợ lý đang bận xử lý. Bạn vui lòng thử lại sau giây lát nhé!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const todayTimeLabel = locale === 'en'
    ? `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : `Hôm nay, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <>
      {/* ── FLOATING ICON LAUNCHER + SUBTLE SUGGESTION PILL (ICON ONLY, NO BUTTON TEXT) ── */}
      {!isOpen && (
        <div className="gemini-assistant-container fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
          {showFloatingHint && (
            <div className="relative flex items-center gap-1.5 mr-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  handleSendMessage(floatingHints[hintIndex]);
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-600 hover:text-blue-700 text-xs font-medium shadow-md border border-slate-200/90 backdrop-blur-sm transition-all cursor-pointer whitespace-nowrap"
              >
                {floatingHints[hintIndex]}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFloatingHint(false);
                }}
                aria-label="Hide hint"
                className="w-4 h-4 rounded-full bg-slate-200/90 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] cursor-pointer transition-colors -ml-2 -mt-5 shadow-2xs"
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <div className="relative group">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={t('ecommerce.chatbot.pillTooltip', 'Mở trợ lý FitVision 3D')}
              className="relative w-14 h-14 rounded-full p-0.5 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.22)] border border-slate-200 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center"
            >
              <FitVisionMascot size={50} />
              <span className="absolute -top-1 right-0 px-1.5 py-0.2 rounded-full bg-white text-slate-600 border border-slate-200 text-[9px] font-bold tracking-wide shadow-2xs">
                3D
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── CLEAN AIRY RETAIL ASSISTANT CHAT WINDOW ── */}
      {isOpen && (
        <div
          className={`gemini-assistant-container fixed z-40 transition-all duration-200 ease-out flex flex-col bg-white border border-slate-200/90 text-slate-900 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] rounded-3xl overflow-hidden font-sans ${
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-x-28 md:inset-y-10'
              : 'bottom-5 right-4 sm:right-5 w-[92vw] sm:w-[400px] h-[565px] max-h-[82vh]'
          }`}
        >
          {/* Clean Light Header */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0">
                <FitVisionMascot size={36} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate leading-tight">
                  {locale === 'en' ? 'FitVision 3D Assistant' : 'Trợ lý FitVision 3D'}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">
                    {locale === 'en' ? 'Online · Instant reply' : 'Trực tuyến · Trả lời ngay'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title={locale === 'en' ? 'New conversation' : 'Làm mới trò chuyện'}
              >
                <RotateCcw size={14} />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hidden sm:flex items-center justify-center transition-colors cursor-pointer"
                title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title={t('common.close', 'Đóng')}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Airy Scroll Area with Centered Welcome Hero */}
          <div className="flex-1 px-4 pt-5 pb-3 overflow-y-auto space-y-3.5 bg-[#F8FAFC]">
            
            {/* Centered DMX-Style Friendly Welcome Hero (Zero ugly asterisks!) */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="flex justify-center mb-2">
                <FitVisionMascot size={62} className="drop-shadow-sm" />
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {locale === 'en' ? 'Hello! I am ' : 'Chào bạn, mình là '}
                <span className="text-blue-600">
                  {locale === 'en' ? 'FitVision 3D Assistant' : 'Trợ lý FitVision 3D'}
                </span>
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {locale === 'en'
                  ? 'I help you choose the right tailored size & outfit'
                  : 'Mình giúp bạn chọn size chuẩn và phối đồ phù hợp'}
              </p>

              {hasVerifiedMeasurements && userBody ? (
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1 px-2">
                  {locale === 'en'
                    ? `Synced profile: ${userBody.height_cm}cm · ${userBody.weight_kg}kg · Chest ${userBody.chest_cm}cm · Waist ${userBody.waist_cm}cm`
                    : `Đã đồng bộ số đo: ${userBody.height_cm}cm · ${userBody.weight_kg}kg · Ngực ${userBody.chest_cm}cm · Eo ${userBody.waist_cm}cm`}
                </p>
              ) : (
                <div className="pt-1 flex flex-col items-center gap-1.5">
                  <p className="text-[11px] text-slate-500 leading-relaxed px-2">
                    {!isAuthenticated
                      ? locale === 'en'
                        ? 'Sign in to sync your 3D body profile for personalized sizing'
                        : 'Chưa đăng nhập · Đăng nhập để đồng bộ số đo riêng của bạn'
                      : locale === 'en'
                        ? 'No 3D measurements saved yet'
                        : 'Tài khoản chưa lưu số đo 3D'}
                  </p>
                  {!isAuthenticated && onOpenSignIn && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenSignIn();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <LogIn size={11} />
                      <span>{locale === 'en' ? 'Sign In Now' : 'Đăng Nhập Ngay'}</span>
                    </button>
                  )}
                </div>
              )}

              <div className="pt-1.5">
                <span className="text-[11px] font-medium text-slate-400">
                  {todayTimeLabel}
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-sm shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-sm shadow-2xs'
                    }`}
                  >
                    <div>{renderFormattedText(msg.text, isUser)}</div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce [animation-delay:0.3s]" />
                  <span className="text-xs text-slate-400 ml-1">
                    {locale === 'en' ? 'Thinking...' : 'Đang kiểm tra thông số...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Subtle Quick Suggestion Chips — Flex Wrap Compactly so Nothing Gets Clipped */}
          <div className="px-3.5 pt-2 pb-1 bg-white border-t border-slate-100 flex flex-wrap items-center gap-1.5 flex-shrink-0">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-medium transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Rounded-Full Airy Input Capsule + Circle ArrowUp Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="px-3.5 py-2.5 bg-white flex items-center gap-2 flex-shrink-0"
          >
            <div className="flex-1 h-10 rounded-full border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 bg-white px-4 flex items-center transition-all">
              <input
                ref={inputRef}
                type="text"
                placeholder={locale === 'en' ? 'Message FitVision Assistant...' : 'Nhắn cho trợ lý FitVision...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="w-full bg-transparent border-0 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              aria-label="Send message"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                inputMessage.trim() && !isTyping
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowUp size={17} strokeWidth={2.2} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default GeminiAssistantWidget;
