import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  User,
  RotateCcw,
  Maximize2,
  Minimize2,
  Ruler,
  Scissors,
  MessageCircle,
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

/** Bespoke atelier concierge emblem (clean fashion/chat mark instead of generic AI sparkles) */
const StylistConciergeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 22,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M9.5 9.5 12 12l2.5-2.5" />
    <path d="M8.5 14h7" />
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buildWelcomeMessage = (): ChatMessage => ({
    id: `welcome-${Date.now()}`,
    sender: 'ai',
    text:
      locale === 'en'
        ? `Hello! I am your **FitVision Style & Sizing Concierge**.
I have synced your 3D measurements: **${userBody.height_cm}cm · ${userBody.weight_kg}kg · Chest ${userBody.chest_cm}cm · Waist ${userBody.waist_cm}cm**.

Ask me anything about optimal sizing, tailoring **Ease Allowance (+4cm ~ +6cm)**, or outfit pairing!`
        : `Xin chào! Tôi là **Chuyên viên Tư Vấn Phom & Size FitVision**.
Hồ sơ số đo của bạn đã sẵn sàng: **${userBody.height_cm}cm · ${userBody.weight_kg}kg · Ngực ${userBody.chest_cm}cm · Eo ${userBody.waist_cm}cm**.

Bạn cần tư vấn chọn size chuẩn phom, giải thích **độ cử động vải (Ease Allowance)** hay gợi ý phối đồ hôm nay?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildWelcomeMessage()]);

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
    setMessages([buildWelcomeMessage()]);
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
        const promptSystem = `You are FitVision 3D's Bespoke Style & Sizing Concierge.
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
Respond concisely (under 140 words), politely, and clearly in ${
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

    await new Promise((r) => setTimeout(r, 550));
    const lower = query.toLowerCase();

    if (lower.includes('size') || lower.includes('kích cỡ') || lower.includes('chuẩn dáng')) {
      return locale === 'en'
        ? `**Tailored Size Analysis for Your Frame**
• **Measurements:** Chest **${userBody.chest_cm}cm** · Waist **${userBody.waist_cm}cm**
• **Shirts & Blazers:** Recommend **Size L** (garment chest ~102cm) for a clean Regular Slim drape with **+6cm Ease Allowance**. Choose **Size M** if you prefer a closer fitted cut.
• **Trousers:** Recommend **Size M** (or Size 31/32) with an elastic/tailored waist allowance so sitting stays comfortable.`
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
• **Regular Classic:** \`+6cm to +9cm\` for all-day movement
• Non-stretch fabrics like Egyptian Cotton or Linen need at least +4cm ease to avoid pulling at the buttons.`
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
              ? 'Sorry, our style advisor is momentarily busy. Please try again in a moment.'
              : 'Xin lỗi, chuyên viên tư vấn đang bận xử lý. Bạn vui lòng thử lại sau giây lát nhé!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ── SLEEK ATELIER CONCIERGE LAUNCHER (BOTTOM-RIGHT) ── */}
      <div className="gemini-assistant-container fixed bottom-5 right-5 z-40 flex items-center gap-2.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t('ecommerce.chatbot.pillTooltip', 'Tư vấn chọn size & phối đồ')}
          className={`group flex items-center gap-2.5 shadow-lg transition-all duration-200 cursor-pointer border ${
            isOpen
              ? 'w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white border-slate-700 justify-center'
              : 'h-12 pl-3.5 pr-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
          }`}
        >
          {isOpen ? (
            <X size={19} strokeWidth={2.2} />
          ) : (
            <>
              <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white shrink-0">
                <StylistConciergeIcon size={15} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </span>
              <span className="text-xs font-bold tracking-tight whitespace-nowrap">
                {locale === 'en' ? 'Style & Fit Concierge' : 'Tư Vấn Size & Phối Đồ'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* ── CLEAN LIGHT ATELIER CONCIERGE CHAT WINDOW ── */}
      {isOpen && (
        <div
          className={`gemini-assistant-container fixed z-40 transition-all duration-200 ease-out flex flex-col bg-white border border-slate-200 text-slate-900 shadow-2xl rounded-2xl overflow-hidden font-sans ${
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-x-28 md:inset-y-10'
              : 'bottom-20 right-4 sm:right-5 w-[92vw] sm:w-[410px] h-[550px] max-h-[78vh]'
          }`}
        >
          {/* Crisp Deep-Navy Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Scissors size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm tracking-tight text-white truncate">
                    {locale === 'en' ? 'FitVision Style Concierge' : 'Tư Vấn May Đo FitVision'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {locale === 'en' ? 'Online' : 'Sẵn sàng'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {t('ecommerce.chatbot.subtitle', 'Trợ lý may đo & tư vấn độ vừa vặn 3D')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title={locale === 'en' ? 'Reset conversation' : 'Làm mới cuộc trò chuyện'}
              >
                <RotateCcw size={14} />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title={t('common.close', 'Đóng')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Synced Biometric Strip */}
          <div className="px-4 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-[11px] flex-shrink-0">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Ruler size={13} className="text-blue-600 shrink-0" />
              <span>{locale === 'en' ? 'Body Profile:' : 'Số đo đồng bộ:'}</span>
              <span className="font-mono font-bold text-blue-700">
                {userBody.height_cm}cm · {userBody.weight_kg}kg
              </span>
            </div>
            <div className="font-mono font-semibold text-slate-600">
              {locale === 'en'
                ? `C:${userBody.chest_cm} · W:${userBody.waist_cm}`
                : `Ngực ${userBody.chest_cm} · Eo ${userBody.waist_cm}`}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      <MessageCircle size={13} className="text-blue-300" />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    <div>{renderFormattedText(msg.text, isUser)}</div>
                    <span
                      className={`block text-[10px] mt-1.5 text-right font-mono ${
                        isUser ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={13} />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2 items-center text-slate-500 text-xs">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={13} className="text-blue-300" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce [animation-delay:0.3s]" />
                  <span className="text-[11px] text-slate-500 ml-1">
                    {locale === 'en' ? 'Analyzing fit & styling...' : 'Đang đối chiếu số đo & phom áo...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar (Clean Pills, No Scrollbar Chrome) */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex items-center gap-1.5 flex-shrink-0">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold transition-colors cursor-pointer flex-shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Clean Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={t('ecommerce.chatbot.placeholder', 'Hỏi tư vấn chọn size, phom dáng, phối đồ...')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs flex-shrink-0 active:scale-95"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default GeminiAssistantWidget;
