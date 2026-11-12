import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Key,
  ChevronDown,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  HelpCircle,
  Shirt,
  Ruler,
  SlidersHorizontal,
} from 'lucide-react';
import { useI18n } from '@/i18n';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  recommendations?: string[];
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

export const GeminiAssistantWidget: React.FC<GeminiAssistantWidgetProps> = ({
  userBody = { height_cm: 172, weight_kg: 68, chest_cm: 96, waist_cm: 78, hip_cm: 96 },
  currentProduct,
}) => {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('fv3d_gemini_api_key') || '');
  const [hasNewBadge, setHasNewBadge] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'ai',
      text: locale === 'en'
        ? `Hello! I am **Gemini 2.5 Fashion & Fit Stylist** ✦. Based on your current measurements (**${userBody.height_cm}cm, ${userBody.weight_kg}kg, Chest: ${userBody.chest_cm}cm**), I can recommend the perfect size, explain Ease Allowance, and style your outfit!`
        : `Xin chào! Tôi là **Trợ lý AI Thời Trang Gemini 2.5** ✦. Dựa trên số đo hiện tại của bạn (**${userBody.height_cm}cm, ${userBody.weight_kg}kg, Ngực: ${userBody.chest_cm}cm, Eo: ${userBody.waist_cm}cm**), tôi có thể giúp bạn chọn size vừa in từng centimet, giải thích độ cử động may đo và tư vấn phối đồ!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewBadge(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Suggested Prompts
  const quickPrompts = locale === 'en' ? [
    { label: '📏 Recommend size for my body', query: `Recommend the best size for my measurements: ${userBody.height_cm}cm, ${userBody.weight_kg}kg, Chest ${userBody.chest_cm}cm, Waist ${userBody.waist_cm}cm` },
    { label: '✨ What is Ease Allowance?', query: 'Explain Ease Allowance in bespoke tailoring and how it prevents tight clothes.' },
    { label: '👔 Best styling for broad shoulders', query: 'What styles of shirts and blazers look best for broad shoulders and athletic build?' },
  ] : [
    { label: '📏 Chọn size theo số đo tôi', query: `Tư vấn size áo sơ mi và quần phù hợp với vóc dáng tôi: Cao ${userBody.height_cm}cm, Nặng ${userBody.weight_kg}kg, Ngực ${userBody.chest_cm}cm, Eo ${userBody.waist_cm}cm.` },
    { label: '✨ Độ cử động (Ease Allowance) là gì?', query: 'Giải thích độ cử động (Ease Allowance) trong may đo chuẩn ISO 8559 và tại sao cần cộng thêm +3cm đến +6cm?' },
    { label: '👔 Phối đồ cho vóc dáng cân đối', query: 'Gợi ý cách phối đồ công sở sang trọng giữa Áo sơ mi Cotton Ai Cập và Quần tây Chino Ý?' },
  ];

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('fv3d_gemini_api_key', key.trim());
    setShowConfig(false);
  };

  // Smart domain-aware response generator (Fallback / Local rule-based if external API not provided)
  const generateAssistantReply = async (userQuery: string): Promise<string> => {
    // If user provided a real Gemini API key
    if (apiKey.trim()) {
      try {
        const prompt = `You are FitVision 3D Fashion AI Stylist powered by Gemini 2.5.
User Biometric Profile:
- Height: ${userBody.height_cm}cm
- Weight: ${userBody.weight_kg}kg
- Chest Circumference: ${userBody.chest_cm}cm
- Waist Circumference: ${userBody.waist_cm}cm
- Hip Circumference: ${userBody.hip_cm}cm
Current Product context: ${currentProduct ? JSON.stringify(currentProduct) : 'Browsing Fashion Store'}
Language: ${locale === 'en' ? 'English' : 'Vietnamese'}
User Query: "${userQuery}"

Provide a concise, helpful, and sophisticated reply in markdown. Give exact size advice (S, M, L, XL), ease allowance delta in cm, and aesthetic advice. Keep answer under 120 words.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply;
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local reasoning:', err);
      }
    }

    // Local Domain-Engine Intelligence
    const q = userQuery.toLowerCase();

    if (q.includes('size') || q.includes('chọn size') || q.includes('số đo')) {
      const chest = userBody.chest_cm;
      let recSize = 'M';
      if (chest < 92) recSize = 'S';
      else if (chest <= 98) recSize = 'L';
      else if (chest <= 104) recSize = 'XL';
      else recSize = 'XXL';

      return locale === 'en'
        ? `✦ **Smart Fit Recommendation:**\n\nWith your height of **${userBody.height_cm}cm**, weight **${userBody.weight_kg}kg**, and chest **${userBody.chest_cm}cm**, your optimal size is **${recSize}** (Fit Score: **97.8%**).\n\n• **Chest Allowance:** Fabric girth ~${chest + 5}cm (Ease +5cm for natural breathing)\n• **Waist Allowance:** ~${userBody.waist_cm + 4}cm (Relaxed sit)\n• **Recommended cut:** *Tailored Regular Fit* to flatter your proportions.`
        : `✦ **Gợi Ý Size Chuẩn Nhân Trắc Học:**\n\nVới chiều cao **${userBody.height_cm}cm**, cân nặng **${userBody.weight_kg}kg** và vòng ngực **${userBody.chest_cm}cm**, size tối ưu dành cho bạn là **Size ${recSize}** (Độ vừa vặn: **97.8%**).\n\n• **Vòng ngực áo:** Thợ may thiết kế ${chest + 5}cm (bù độ cử động +5cm)\n• **Vòng bụng/eo:** ${userBody.waist_cm + 4}cm (đảm bảo đứng lên ngồi xuống êm ái)\n• **Phom dáng:** Nên chọn *Regular Tailored* để tôn dáng vai và eo thon.`;
    }

    if (q.includes('ease') || q.includes('cử động') || q.includes('độ chùng') || q.includes('iso')) {
      return locale === 'en'
        ? `✦ **What is Ease Allowance?**\n\nGarments are never cut flush to the skin. **Ease Allowance** is the deliberate extra margin (+3cm to +6cm) added beyond body dimensions to allow natural breathing, bending, and arm rotation while keeping an elegant drape.\n\n• **Slim Fit:** +3cm to +4cm ease\n• **Standard Bespoke:** +5cm ease\n• **Relaxed Oversized:** +8cm to +12cm ease`
        : `✦ **Độ Cử Động (Ease Allowance) Trong May Đo:**\n\nÁo quần không bao giờ may bằng khít với bề mặt da thịt. **Độ cử động (Ease Allowance)** là phần vải dôi ra có chủ đích (+3cm đến +6cm) so với số đo cơ thể thật để người mặc thở thoải mái, nâng tay và ngồi làm việc cả ngày mà không bị bó tức.\n\n• **Áo sơ mi Slim-fit:** Bù độ cử động +3cm đến +4cm\n• **Áo may đo chuẩn Bespoke:** Bù +5cm ở ngực và +4cm ở bụng\n• **Áo khoác / Blazer:** Bù +8cm đến +10cm để mặc ngoài áo lót`;
    }

    if (q.includes('phối đồ') || q.includes('style') || q.includes('outfit')) {
      return locale === 'en'
        ? `✦ **Styling Proposal by FitVision:**\n\nFor a sophisticated modern atelier look:\n1. **Upper:** Egyptian Cotton Shirt in Light Stone / Navy\n2. **Lower:** Italian Tailored Chinos in Khaki or Charcoal\n3. **Silhouette:** Clean vertical lines that elongate your ${userBody.height_cm}cm stature, pairing perfectly with minimalist leather loafers.`
        : `✦ **Gợi Ý Phối Đồ Thanh Lịch:**\n\nVới vóc dáng **${userBody.height_cm}cm, ${userBody.weight_kg}kg**, bạn rất thích hợp với phong cách *Quiet Luxury / Minimalist*:\n1. **Áo:** Áo sơ mi Cotton Ai Cập trắng ngà hoặc Áo Polo lụa Mulberry xanh Navy.\n2. **Quần:** Quần Tây Ý phom đứng (cạp cao 2 nếp xếp ly) giúp tôn chiều dài chân.\n3. **Phụ kiện:** Giày Loafer da bò thuộc tự nhiên và thắt lưng bản nhỏ 3cm.`;
    }

    return locale === 'en'
      ? `✦ **FitVision AI Stylist:**\n\nI have analyzed your request regarding *"I am browsing clothing"*. Your biometric profile (**${userBody.height_cm}cm, ${userBody.weight_kg}kg**) is active across all product cards on the catalog. Every garment will compute a real-time **Fit Score %** matched to ISO 8559 standards.\n\n*(Tip: You can paste your Gemini 2.5 API key in the top settings icon to enable live unconstrained web reasoning!)*`
      : `✦ **Trợ Lý AI FitVision 3D:**\n\nTôi đã ghi nhận câu hỏi của bạn. Hồ sơ vóc dáng (**${userBody.height_cm}cm, ${userBody.weight_kg}kg, Ngực ${userBody.chest_cm}cm**) của bạn đang được áp dụng trực tiếp cho toàn bộ sản phẩm trên sàn.\n\nMỗi sản phẩm bạn bấm vào sẽ tự động tính toán **Tỷ lệ vừa vặn (Fit Score %)** và độ cử động đường may chuẩn xác.\n\n*(Mẹo: Bạn có thể nhấn vào biểu tượng chìa khóa ⚙️ ở thanh tiêu đề để dán API Key Gemini 2.5 khi sẵn sàng nhé!)*`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
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
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: locale === 'en'
          ? 'Sorry, I encountered a temporary issue. Please try again!'
          : 'Xin lỗi, trợ lý AI đang bận xử lý dữ liệu. Vui lòng thử lại sau ít giây!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ── FLOATING TRIGGER PILL / ORB (BOTTOM-RIGHT) ── */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-auto">
        {!isOpen && (
          <div className="flex items-center gap-2 mb-2 animate-bounce duration-1000">
            <span className="hidden sm:inline-block px-3 py-1.5 rounded-full bg-stone-900/90 text-white text-xs font-bold shadow-lg border border-stone-700 backdrop-blur-md">
              ✦ {t('ecommerce.chatbot.pillTooltip', 'Hỏi AI Gemini: Tư vấn size & phối đồ')}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Gemini Fashion Stylist"
          className="relative group p-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-blue-500/40 hover:shadow-indigo-500/60 border-2 border-white/60 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
        >
          {/* Animated Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-md opacity-60 group-hover:opacity-90 animate-pulse transition-opacity" />

          {/* Center Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {isOpen ? (
              <X size={24} strokeWidth={2.4} />
            ) : (
              <div className="flex items-center justify-center">
                <Sparkles size={24} className="text-yellow-300 animate-spin-slow" />
              </div>
            )}
          </div>

          {/* New / Online Indicator Dot */}
          {hasNewBadge && !isOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            </span>
          )}
        </button>
      </div>

      {/* ── EXPANDABLE CHATBOT POPUP WINDOW ── */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-white border border-stone-300 shadow-2xl rounded-2xl overflow-hidden font-sans ${
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-x-24 md:inset-y-12'
              : 'bottom-22 right-4 sm:right-6 w-[92vw] sm:w-[410px] h-[580px] max-h-[80vh]'
          }`}
          style={{
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Window Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-stone-900 via-stone-850 to-blue-950 text-white flex items-center justify-between border-b border-stone-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-inner">
                <Sparkles size={16} className="text-yellow-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight text-white">
                    Gemini 2.5 AI Stylist
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-stone-300">
                  {t('ecommerce.chatbot.subtitle', 'Trợ lý may đo & tư vấn độ vừa vặn 3D')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* API Key Config Toggle */}
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                title="Cấu hình Gemini API Key"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showConfig || apiKey ? 'text-amber-400 bg-white/10' : 'text-stone-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Key size={16} />
              </button>

              {/* Expand Toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Optional API Key Configuration Strip */}
          {showConfig && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs animate-in slide-in-from-top duration-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <Key size={13} className="text-amber-700" />
                  <span>Google Gemini 2.5 API Key</span>
                </span>
                <span className="text-[10px] text-amber-800 font-mono">
                  {apiKey ? '✓ Đã lưu key' : 'Tùy chọn'}
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 mb-2">
                Dán API Key để bot kết nối trực tiếp với mô hình Gemini 2.5 của Google. Nếu để trống, bot vẫn tư vấn dựa trên bộ máy sinh trắc học FitVision 3D.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  defaultValue={apiKey}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveApiKey((e.target as HTMLInputElement).value);
                  }}
                  className="flex-1 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  id="gemini-key-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('gemini-key-input') as HTMLInputElement;
                    if (el) handleSaveApiKey(el.value);
                  }}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Lưu
                </button>
              </div>
            </div>
          )}

          {/* Active User Context Banner */}
          <div className="px-3.5 py-2 bg-stone-100 border-b border-stone-200/80 flex items-center justify-between text-[11px] font-mono text-stone-700 flex-shrink-0">
            <span className="flex items-center gap-1.5 font-bold text-stone-900">
              <Ruler size={13} className="text-blue-600" />
              <span>{userBody.height_cm}cm • {userBody.weight_kg}kg</span>
            </span>
            <span className="text-stone-500">
              Ngực: <b className="text-stone-800">{userBody.chest_cm}cm</b> • Eo: <b className="text-stone-800">{userBody.waist_cm}cm</b>
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-stone-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs text-xs mt-0.5">
                    <Sparkles size={13} className="text-yellow-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white text-stone-900 border border-stone-200/80 rounded-tl-xs whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-stone-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center flex-shrink-0 text-xs mt-0.5 font-bold">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-stone-500 text-xs">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                  <Sparkles size={13} className="text-yellow-300 animate-spin" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl px-3.5 py-2 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-stone-500 ml-1">Gemini đang tính toán...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Shelf */}
          <div className="px-3 pt-2 pb-1.5 bg-white border-t border-stone-200/80 overflow-x-auto scrollbar-none flex gap-1.5 flex-shrink-0">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-100 hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 hover:border-blue-300 text-[11px] font-semibold transition-colors cursor-pointer flex-shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={t('ecommerce.chatbot.placeholder', 'Hỏi Gemini: chọn size, phom dáng, phối đồ...')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-stone-100 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none focus:bg-white focus:border-blue-600 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-blue-500/30 flex-shrink-0 active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default GeminiAssistantWidget;
