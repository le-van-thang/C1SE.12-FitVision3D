import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ArrowUp,
  RotateCcw,
  Maximize2,
  Minimize2,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { authApi, getAccessToken, setAccessToken } from '@/services/authApi';
import { BOT_UI_PROFILES, type AiBotId, type BotUiProfile } from './botProfiles';

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
  botId?: AiBotId;
  accountKey?: string | null;
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

/** Role-themed FitVision Mascot Avatar */
const FitVisionMascot: React.FC<{
  profile: BotUiProfile;
  size?: number;
  className?: string;
}> = ({ profile, size = 44, className = '' }) => {
  const bgId = `fvMascotBg-${profile.id}`;
  const capId = `fvMascotCap-${profile.id}`;
  return (
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
        <linearGradient id={bgId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={profile.gradientFrom} />
          <stop offset="100%" stopColor={profile.gradientTo} />
        </linearGradient>
        <linearGradient id={capId} x1="16" y1="8" x2="48" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={profile.capFrom} />
          <stop offset="100%" stopColor={profile.capTo} />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="30" fill={`url(#${bgId})`} />
      <circle cx="32" cy="32" r="29" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.5" />

      <path d="M15 54C16.5 45.5 23 41 32 41C41 41 47.5 45.5 49 54" fill="#0F172A" />
      <path d="M25 42L32 49L39 42L36 40.5H28L25 42Z" fill="#FFFFFF" />
      <path d="M30.5 45.5L32 53L33.5 45.5L32 43.5L30.5 45.5Z" fill={profile.capFrom} />

      <circle cx="32" cy="28.5" r="12.5" fill="#EFF6FF" />
      <path
        d="M19 26.5C19 19 24.8 14 32.5 14C40.5 14 45.5 19.2 45 25.5C41.5 22.8 37.5 21.5 32 21.5C26.5 21.5 22.5 23.2 19 26.5Z"
        fill={`url(#${capId})`}
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
};

/** Render **bold** and `code`, convert leading markdown `* ` / `- ` bullets cleanly */
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
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
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
  botId = 'customer',
  accountKey = null,
  userBody,
  isAuthenticated = false,
  hasBodyProfile = false,
  onOpenSignIn,
}) => {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';
  const profile = BOT_UI_PROFILES[botId] || BOT_UI_PROFILES.customer;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showFloatingHint, setShowFloatingHint] = useState<boolean>(true);
  const [hintIndex, setHintIndex] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasVerifiedMeasurements = botId === 'customer' && isAuthenticated && hasBodyProfile && !!userBody;
  const floatingHints = isEn ? profile.floatingHintsEn : profile.floatingHintsVi;
  const quickPrompts = isEn ? profile.quickPromptsEn : profile.quickPromptsVi;

  const buildInitialGreetingBubble = (): ChatMessage => ({
    id: `welcome-${botId}-${Date.now()}`,
    sender: 'ai',
    text: isEn ? profile.greetingEn : profile.greetingVi,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildInitialGreetingBubble()]);

  // Strictly isolate conversation history when switching bot role, account, or language
  useEffect(() => {
    setMessages([buildInitialGreetingBubble()]);
    setHintIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId, accountKey, isAuthenticated, locale]);

  useEffect(() => {
    if (isOpen || !showFloatingHint) return;
    const timer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % floatingHints.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isOpen, showFloatingHint, floatingHints.length]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleResetChat = () => {
    setMessages([buildInitialGreetingBubble()]);
  };

  const callBotApi = async (
    query: string,
    historyPayload: Array<{ role: 'user' | 'model'; text: string }>,
    token: string | null
  ) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Security rule: authenticated users rely on server-side DB context, NEVER client-sent userBody
    const guestBody =
      botId === 'customer' && !isAuthenticated && userBody && userBody.height_cm > 0 && userBody.weight_kg > 0
        ? {
            height_cm: userBody.height_cm,
            weight_kg: userBody.weight_kg,
            chest_cm: userBody.chest_cm,
            waist_cm: userBody.waist_cm,
            hip_cm: userBody.hip_cm,
          }
        : null;

    return fetch(`${BACKEND_BASE_URL}/api/v1/ai/${botId}/chat`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        query,
        locale: isEn ? 'en' : 'vi',
        history: historyPayload,
        guestBody,
      }),
    });
  };

  const generateAssistantReply = async (
    query: string,
    priorMessages: ChatMessage[]
  ): Promise<string> => {
    const historyPayload = priorMessages
      .filter((m) => !m.id.startsWith('welcome-'))
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text.slice(0, 1000),
      }));

    try {
      let token = getAccessToken();
      let res = await callBotApi(query, historyPayload, token);

      // If access token expired, attempt silent refresh once and retry
      if (res.status === 401 && isAuthenticated) {
        const refreshed = await authApi.refreshToken();
        if (refreshed.success && refreshed.data?.accessToken) {
          setAccessToken(refreshed.data.accessToken);
          token = refreshed.data.accessToken;
          res = await callBotApi(query, historyPayload, token);
        }
      }

      if (res.ok) {
        const json = await res.json();
        const replyText = json?.data?.reply;
        if (replyText) return replyText;
      }

      if (res.status === 401) {
        return isEn
          ? 'Your session has expired or you need to **Sign In** to use this role-specific assistant.'
          : 'Phiên đăng nhập đã hết hạn hoặc bạn cần **Đăng nhập** đúng tài khoản để sử dụng trợ lý AI này.';
      }

      if (res.status === 403) {
        return isEn
          ? 'Your account role does not have permission to access this assistant.'
          : 'Tài khoản hiện tại không có quyền sử dụng trợ lý AI của phân hệ này.';
      }

      if (res.status === 429) {
        const errJson = await res.json().catch(() => null);
        return (
          errJson?.error?.message ||
          (isEn
            ? 'You are sending messages too quickly. Please wait a few seconds.'
            : 'Bạn đang gửi câu hỏi hơi nhanh. Vui lòng thử lại sau ít giây nhé.')
        );
      }
    } catch {
      // Network offline fallback handled below
    }

    if (botId === 'shop') {
      return isEn
        ? 'Unable to reach Seller Copilot server right now. Please check your backend connection and try again.'
        : 'Hiện không kết nối được máy chủ **Seller Copilot**. Bạn vui lòng kiểm tra kết nối backend và thử lại nhé.';
    }
    if (botId === 'admin') {
      return isEn
        ? 'Unable to reach Admin Ops Copilot server right now. Please verify the backend service is running.'
        : 'Hiện không kết nối được máy chủ **Admin Ops Copilot**. Vui lòng kiểm tra dịch vụ backend đang hoạt động.';
    }

    return isEn
      ? 'I am momentarily offline. Please try again in a moment or sign in to check your 3D sizing profile.'
      : 'Trợ lý đang tạm mất kết nối máy chủ. Bạn vui lòng thử lại sau ít giây nhé!';
  };

  const handleSendMessage = async (customQuery?: string) => {
    const query = (customQuery ?? inputMessage).trim();
    if (!query || isTyping) return;

    const priorSnapshot = [...messages];
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputMessage('');
    setIsTyping(true);

    try {
      const reply = await generateAssistantReply(query, priorSnapshot);
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
          text: isEn
            ? 'Sorry, our assistant is momentarily busy. Please try again in a moment.'
            : 'Xin lỗi, trợ lý đang bận xử lý. Bạn vui lòng thử lại sau giây lát nhé!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const todayTimeLabel = isEn
    ? `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : `Hôm nay, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <>
      {/* ── FLOATING ICON LAUNCHER + ROLE SUGGESTION PILL ── */}
      {!isOpen && (
        <div className="gemini-assistant-container fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
          {showFloatingHint && (
            <div className="relative flex items-center gap-1.5 mr-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  void handleSendMessage(floatingHints[hintIndex]);
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 text-xs font-medium shadow-md border border-slate-200/90 backdrop-blur-sm transition-all cursor-pointer whitespace-nowrap"
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
              aria-label={isEn ? profile.titleEn : profile.titleVi}
              className="relative w-14 h-14 rounded-full p-0.5 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.22)] border border-slate-200 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center"
            >
              <FitVisionMascot profile={profile} size={50} />
              <span className="absolute -top-1 right-0 px-1.5 py-0.2 rounded-full bg-white text-slate-700 border border-slate-200 text-[9px] font-bold tracking-wide shadow-2xs">
                {profile.badgeText}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── ROLE-SPECIFIC ASSISTANT CHAT WINDOW ── */}
      {isOpen && (
        <div
          className={`gemini-assistant-container fixed z-40 transition-all duration-200 ease-out flex flex-col bg-white border border-slate-200/90 text-slate-900 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] rounded-3xl overflow-hidden font-sans ${
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-x-28 md:inset-y-10'
              : 'bottom-5 right-4 sm:right-5 w-[92vw] sm:w-[400px] h-[565px] max-h-[82vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0">
                <FitVisionMascot profile={profile} size={36} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate leading-tight">
                  {isEn ? profile.titleEn : profile.titleVi}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">
                    {isEn ? profile.subtitleEn : profile.subtitleVi}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title={isEn ? 'New conversation' : 'Làm mới trò chuyện'}
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

          {/* Scroll Area */}
          <div className="flex-1 px-4 pt-5 pb-3 overflow-y-auto space-y-3.5 bg-[#F8FAFC]">
            <div className="text-center space-y-1.5 pb-2">
              <div className="flex justify-center mb-2">
                <FitVisionMascot profile={profile} size={62} className="drop-shadow-sm" />
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {isEn ? 'Hello! I am ' : 'Chào bạn, mình là '}
                <span className={profile.accentTextClass}>
                  {isEn ? profile.titleEn : profile.titleVi}
                </span>
              </p>
              <p className="text-xs font-semibold text-slate-700 px-2">
                {isEn ? profile.heroTaglineEn : profile.heroTaglineVi}
              </p>

              {botId === 'customer' ? (
                hasVerifiedMeasurements && userBody ? (
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1 px-2">
                    {isEn
                      ? `Synced profile: ${userBody.height_cm}cm · ${userBody.weight_kg}kg · Chest ${userBody.chest_cm}cm · Waist ${userBody.waist_cm}cm`
                      : `Đã đồng bộ số đo: ${userBody.height_cm}cm · ${userBody.weight_kg}kg · Ngực ${userBody.chest_cm}cm · Eo ${userBody.waist_cm}cm`}
                  </p>
                ) : (
                  <div className="pt-1 flex flex-col items-center gap-1.5">
                    <p className="text-[11px] text-slate-500 leading-relaxed px-2">
                      {!isAuthenticated
                        ? isEn
                          ? 'Sign in to sync your 3D body profile & personal orders'
                          : 'Chưa đăng nhập · Đăng nhập để đồng bộ số đo & đơn hàng riêng'
                        : isEn
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
                        <span>{isEn ? 'Sign In Now' : 'Đăng Nhập Ngay'}</span>
                      </button>
                    )}
                  </div>
                )
              ) : (
                <div className="pt-1 flex justify-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                    <ShieldCheck size={11} />
                    <span>
                      {isEn
                        ? 'Role-verified · Read-only advisory'
                        : 'Phân quyền JWT · Chế độ tư vấn chỉ đọc'}
                    </span>
                  </span>
                </div>
              )}

              <div className="pt-1.5">
                <span className="text-[11px] font-medium text-slate-400">
                  {todayTimeLabel}
                </span>
              </div>
            </div>

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
                        ? `${profile.bubbleBgClass} text-white rounded-br-sm shadow-xs`
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
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.3s]" />
                  <span className="text-xs text-slate-400 ml-1">
                    {isEn ? profile.thinkingEn : profile.thinkingVi}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3.5 pt-2 pb-1 bg-white border-t border-slate-100 flex flex-wrap items-center gap-1.5 flex-shrink-0">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => void handleSendMessage(p.query)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer ${profile.chipHoverClass}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="px-3.5 py-2.5 bg-white flex items-center gap-2 flex-shrink-0"
          >
            <div className={`flex-1 h-10 rounded-full border border-slate-300 focus-within:ring-2 bg-white px-4 flex items-center transition-all ${profile.inputFocusClass}`}>
              <input
                ref={inputRef}
                type="text"
                placeholder={isEn ? profile.placeholderEn : profile.placeholderVi}
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
                  ? `${profile.sendBtnClass} text-white shadow-sm cursor-pointer active:scale-95`
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
