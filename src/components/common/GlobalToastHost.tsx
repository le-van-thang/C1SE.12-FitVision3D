import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type GlobalToastType = 'success' | 'info' | 'warning' | 'error';

export interface GlobalToastPayload {
  type?: GlobalToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ActiveToast extends Required<Pick<GlobalToastPayload, 'type' | 'title'>> {
  id: string;
  message?: string;
}

const TOAST_EVENT_NAME = 'fv3d-global-toast';

export function showGlobalToast(payload: GlobalToastPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<GlobalToastPayload>(TOAST_EVENT_NAME, { detail: payload }));
}

export const GlobalToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const custom = e as CustomEvent<GlobalToastPayload>;
      const detail = custom.detail;
      if (!detail || !detail.title) return;

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nextToast: ActiveToast = {
        id,
        type: detail.type || 'success',
        title: detail.title,
        message: detail.message,
      };

      setToasts((prev) => [nextToast, ...prev].slice(0, 4));

      const timeout = detail.durationMs ?? 4200;
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, timeout);
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-5 right-5 z-[10000] flex flex-col gap-2.5 w-[calc(100vw-2.5rem)] max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const toneStyles =
          toast.type === 'success'
            ? {
                border: 'border-emerald-200',
                iconWrap: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                bar: 'bg-emerald-500',
                Icon: CheckCircle2,
              }
            : toast.type === 'info'
            ? {
                border: 'border-blue-200',
                iconWrap: 'bg-blue-50 text-blue-600 border-blue-200',
                bar: 'bg-blue-600',
                Icon: Info,
              }
            : toast.type === 'warning'
            ? {
                border: 'border-amber-200',
                iconWrap: 'bg-amber-50 text-amber-600 border-amber-200',
                bar: 'bg-amber-500',
                Icon: AlertTriangle,
              }
            : {
                border: 'border-rose-200',
                iconWrap: 'bg-rose-50 text-rose-600 border-rose-200',
                bar: 'bg-rose-500',
                Icon: XCircle,
              };

        const IconComponent = toneStyles.Icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border ${toneStyles.border} shadow-xl p-3.5 flex items-start gap-3 animate-fade-in`}
          >
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${toneStyles.iconWrap}`}
            >
              <IconComponent size={17} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-extrabold text-[#14161A] leading-snug">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="w-6 h-6 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center shrink-0 cursor-pointer border-0 bg-transparent transition"
              aria-label="Đóng thông báo"
            >
              <X size={13} />
            </button>

            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${toneStyles.bar} opacity-80`} />
          </div>
        );
      })}
    </div>
  );
};
