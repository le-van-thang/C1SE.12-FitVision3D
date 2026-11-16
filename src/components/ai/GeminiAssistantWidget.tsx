import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ArrowUp,
  RotateCcw,
  Maximize2,
  Minimize2,
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
  currentProduct?: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
}

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

/** Friendly custom FitVision 3D Atelier Mascot Avatar (inspired by friendly retail assistant mascots) */
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

    {/* Circular Backdrop */}
    <circle cx="32" cy="32" r="30" fill="url(#fvMascotBg)" />
    <circle cx="32" cy="32" r="29" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.5" />

    {/* Tailor / Stylist Suit Shoulders */}
    <path
      d="M15 54C16.5 45.5 23 41 32 41C41 41 47.5 45.5 49 54"
      fill="#0F172A"
    />
    {/* Crisp White Collar & Royal Blue Tie */}
    <path d="M25 42L32 49L39 42L36 40.5H28L25 42Z" fill="#FFFFFF" />
    <path d="M30.5 45.5L32 53L33.5 45.5L32 43.5L30.5 45.5Z" fill="#3B82F6" />

    {/* Friendly Round Face */}
    <circle cx="32" cy="28.5" r="12.5" fill="#EFF6FF" />

    {/* Stylized Blue Atelier Beret / Hair Accent */}
    <path
      d="M19 26.5C19 19 24.8 14 32.5 14C40.5 14 45.5 19.2 45 25.5C41.5 22.8 37.5 21.5 32 21.5C26.5 21.5 22.5 23.2 19 26.5Z"
      fill="url(#fvMascotCap)"
    />

    {/* Cute Friendly Eyes */}
    <circle cx="27" cy="28.5" r="1.9" fill="#0F172A" />
    <circle cx="37" cy="28.5" r="1.9" fill="#0F172A" />
    <circle cx="27.6" cy="27.8" r="0.65" fill="#FFFFFF" />
    <circle cx="37.6" cy="27.8" r="0.65" fill="#FFFFFF" />

    {/* Warm Cheeks & Friendly Smile */}
    <circle cx="23.5" cy="31.5" r="1.7" fill="#93C5FD" fillOpacity="0.55" />
    <circle cx="40.5" cy="31.5" r="1.7" fill="#93C5FD" fillOpacity="0.55" />
    <path
      d="M28.5 32.8C29.6 34.3 34.4 34.3 35.5 32.8"
      stroke="#0F172A"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* Small Measuring Accent Tag */}
    <circle cx="46.5" cy="18.5" r="5.2" fill="#FACC15" stroke="#FFFFFF" strokeWidth="1.4" />
    <path d="M44.5 18.5H48.5M46.5 16.5V20.5" stroke="#0F172A" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Render **bold** and `inline code` cleanly without exposing raw markdown asterisks */
const renderFormattedText = (text: string, isUser: boolean): React.ReactNode => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
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
      return <React.Fragment key={partIdx}>{part}</React.Fragment>;
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
  userBody = { height_cm: 172, weight_kg: 68, chest_cm: 96, waist_cm: 78, hip_cm: 96 },
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

  // Rotate floating subtle hint pill every 4.5s
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
        : `Dạ em có thể giúp gì cho bạn ạ?`,
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
            query: `Recommend the best size for my measurements: ${userBody.height_cm}cm, ${userBody.weight_kg}kg, Chest ${userBody.chest_cm}cm, Waist ${userBody.waist_cm}cm.`,
          },
          {
            label: 'What is Ease Allowance?',
            query: 'Explain Ease Allowance in bespoke tailoring and how it keeps clothes comfortable.',
          },
          {
            label: 'Outfit pairing advice',
            query: 'Suggest an elegant smart-casual outfit pairing for my build.',
          },
        ]
      : [
          {
            label: 'Tư vấn size chuẩn dáng tôi',
            query: `Dựa vào số đo Cao ${userBody.height_cm}cm, Nặng ${userBody.weight_kg}kg, Ngực ${userBody.chest_cm}cm, Eo ${userBody.waist_cm}cm, hãy tư vấn size áo sơ mi, blazer và quần vừa vặn nhất cho tôi.`,
          },
          {
            label: 'Độ cử động (Ease) là gì?',
            query: 'Giải thích độ cử động vải (Ease Allowance) chuẩn ISO 8559 và vì sao cần cộng +4cm đến +6cm quanh ngực áo?',
          },
          {
            label: 'Gợi ý phối đồ công sở',
            query: 'Gợi ý cách phối đồ lịch lãm giữa Áo Sơ Mi Oxford và Quần Tây Ý theo số đo của tôi.',
          },
        ];

  const generateAssistantReply = async (query: string): Promise<string> => {
    if (GEMINI_API_KEY) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const promptSystem = `You are FitVision 3D's friendly, helpful Style & Sizing Assistant.
Customer Biometrics (ISO 8559-1):
- Height: ${userBody.height_cm} cm
- Weight: ${userBody.weight_kg} kg
- Chest: ${userBody.chest_cm} cm
- Waist: ${userBody.waist_cm} cm
- Hip: ${userBody.hip_cm} cm
Store Catalog Highlights:
- Áo Sơ Mi Oxford Cotton Ai Cập (590.000đ)
- Áo Blazer Linen Pháp Phom May Đo (1.650.000đ)
- Quần Tây Xếp Ly Đôi Phom Ý (765.000đ)
- Áo Polo Dệt Kim Lụa (520.000đ)
- Đầm Lụa Satin Cổ Đổ (1.250.000đ)
Respond warmly, concisely (under 130 words) in ${
          locale === 'en' ? 'English' : 'Vietnamese'
        }. Use **bold** sparingly for sizes and key numbers.`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${promptSystem}\n\nCustomer question: ${query}` }] },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) return replyText;
        }
      } catch {
        // Fallback smoothly to domain expert sizing engine
      }
    }

    await new Promise((r) => setTimeout(r, 500));
    const lower = query.toLowerCase();

    if (lower.includes('size') || lower.includes('kích cỡ') || lower.includes('vừa vặn') || lower.includes('chuẩn dáng')) {
      return locale === 'en'
        ? `**Tailored Size Analysis for Your Frame**
• **Measurements:** Chest **${userBody.chest_cm}cm** · Waist **${userBody.waist_cm}cm**
• **Shirts & Blazers:** Recommend **Size L** (garment chest ~102cm) for a clean Regular Slim drape with **+6cm Ease Allowance**. Choose **Size M** if you prefer a closer fitted cut.
• **Trousers:** Recommend **Size M** with tailored waist ease so sitting stays comfortable.`
        : `**Phân Tích Kích Cỡ Chuẩn Theo Vóc Dáng**
• **Số đo hiện tại:** Ngực **${userBody.chest_cm}cm** · Eo **${userBody.waist_cm}cm**
• **Áo Sơ Mi & Blazer:** Phù hợp nhất là **Size L** (vòng ngực áo ~102cm, đạt độ cử động **+6cm Ease Allowance**) cho phom đứng lịch lãm. Nếu thích ôm body hơn, có thể chọn **Size M**.
• **Quần Tây / Chino Ý:** Khuyên dùng **Size M** để ôm gọn phần hông và thoải mái khi ngồi làm việc.`;
    }

    if (lower.includes('ease') || lower.includes('cử động') || lower.includes('iso')) {
      return locale === 'en'
        ? `**Understanding Ease Allowance (ISO 8559-1)**
Tailored garments are never cut equal to bare skin measurements:
• Formula: \`Garment Size = Body Measurement + Ease Allowance\`
• **Slim Fit:** \`+3cm to +5cm\` chest room
• **Regular Classic:** \`+6cm to +9cm\` for all-day movement`
        : `**Độ Cử Động Vải (Ease Allowance) Chuẩn ISO 8559**
Trang phục may đo chuẩn mực **không bao giờ cắt bằng khít với số đo cơ thể**:
• Công thức: \`Thông số áo = Số đo cơ thể + Độ cử động\`
• **Phom Ôm (Slim):** cộng thêm \`+3cm ~ +5cm\` vòng ngực.
• **Phom Tiêu Chuẩn (Regular):** cộng \`+6cm ~ +9cm\` giúp vươn tay, lái xe và ngồi thoải mái không bị căng khuy ngực.`;
    }

    return locale === 'en'
      ? `**Bespoke Styling Suggestion**
With your **${userBody.height_cm}cm / ${userBody.weight_kg}kg** proportions:
1. **Top:** Pair the **French Normandy Flax Linen Blazer** or **Egyptian Cotton Oxford Shirt** (Size L) to frame the shoulders cleanly.
2. **Bottom:** Match with **Italian Double-Pleated Tapered Trousers** (Size M) in Charcoal or Navy to elongate your silhouette.
3. Open **3D Virtual Fitting** anytime to preview the fit score directly.`
      : `**Gợi Ý Phối Đồ Chuẩn Phom Từ FitVision**
Với tỉ lệ **${userBody.height_cm}cm · ${userBody.weight_kg}kg** cân đối:
1. **Áo:** Chọn **Áo Sơ Mi Oxford Cotton Ai Cập** (Size M/L) hoặc khoác ngoài **Blazer Linen Pháp** (Size L) giúp phần cầu vai đứng phom và thoáng nhẹ.
2. **Quần:** Phối cùng **Quần Tây Xếp Ly Đôi Phom Ý** (Size M) tông Than Chì hoặc Xanh Navy để tôn chiều cao.
3. Bạn có thể bấm **Phòng Thử Đồ Ảo 3D** trên thanh công cụ để xem thử phom trực quan ngay!`;
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
      {/* ── FLOATING ICON LAUNCHER + SUBTLE SUGGESTION PILL (DMX STYLE: ICON ONLY, NO BUTTON TEXT) ── */}
      {!isOpen && (
        <div className="gemini-assistant-container fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
          {/* Subtle Floating Suggestion Bubble above-left of mascot */}
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

          {/* Icon-Only Mascot Button + Tiny Subtle Badge */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={t('ecommerce.chatbot.pillTooltip', 'Mở trợ lý FitVision 3D')}
              className="relative w-14 h-14 rounded-full p-0.5 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.22)] border border-slate-200 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center"
            >
              <FitVisionMascot size={50} />
              {/* Small subtle corner status indicator */}
              <span className="absolute -top-1 right-0 px-1.5 py-0.2 rounded-full bg-white text-slate-600 border border-slate-200 text-[9px] font-bold tracking-wide shadow-2xs">
                3D
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── CLEAN AIRY RETAIL ASSISTANT CHAT WINDOW (DMX INSPIRED) ── */}
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

            {/* Clean Circular Action Controls */}
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
            
            {/* Centered DMX-Style Friendly Welcome Hero */}
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
              <p className="text-[11px] italic text-slate-400 leading-relaxed pt-1 px-2">
                {locale === 'en'
                  ? `* Synced profile: ${userBody.height_cm}cm · ${userBody.weight_kg}kg · Chest ${userBody.chest_cm}cm · Waist ${userBody.waist_cm}cm`
                  : `* Đã đồng bộ số đo của bạn: ${userBody.height_cm}cm · ${userBody.weight_kg}kg · Ngực ${userBody.chest_cm}cm · Eo ${userBody.waist_cm}cm`}
              </p>
              <div className="pt-2">
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
                    {locale === 'en' ? 'Thinking...' : 'Đang kiểm tra số đo...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Subtle Quick Suggestion Chips */}
          <div className="px-3.5 pt-2 pb-1 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex items-center gap-1.5 flex-shrink-0">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.query)}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-medium transition-colors cursor-pointer flex-shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Rounded-Full Airy Input Capsule + Circle ArrowUp Button (DMX Style) */}
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
