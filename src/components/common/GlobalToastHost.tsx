import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  durationMs: number;
  exiting: boolean;
}

const TOAST_EVENT_NAME = 'fv3d-global-toast';
const EXIT_ANIMATION_MS = 260;

export function showGlobalToast(payload: GlobalToastPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<GlobalToastPayload>(TOAST_EVENT_NAME, { detail: payload }));
}

export const GlobalToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  };

  useEffect(() => {
    const handleToast = (e: Event) => {
      const custom = e as CustomEvent<GlobalToastPayload>;
      const detail = custom.detail;
      if (!detail || !detail.title) return;

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const durationMs = detail.durationMs ?? 2400;

      const nextToast: ActiveToast = {
        id,
        type: detail.type || 'success',
        title: detail.title,
        message: detail.message,
        durationMs,
        exiting: false,
      };

      setToasts((prev) => [nextToast, ...prev].slice(0, 4));

      window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleToast);
  }, []);

  if (toasts.length === 0 || typeof document === 'undefined') return null;

  const content = (
    <>
      <style>{`
        @keyframes fvToastSlideIn {
          0% {
            opacity: 0;
            transform: translate3d(110%, 0, 0) scale(0.94);
          }
          70% {
            opacity: 1;
            transform: translate3d(-4px, 0, 0) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes fvToastSlideOut {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(115%, 0, 0) scale(0.95);
          }
        }
        @keyframes fvToastProgress {
          0% {
            transform: scaleX(1);
          }
          100% {
            transform: scaleX(0);
          }
        }
        @keyframes fvToastIconPop {
          0% {
            transform: scale(0.6) rotate(-10deg);
          }
          65% {
            transform: scale(1.12) rotate(3deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 18,
          right: 18,
          zIndex: 2147483647,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: 365,
          maxWidth: 'calc(100vw - 28px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const palette =
            toast.type === 'success'
              ? {
                  accent: '#10B981',
                  gradient: 'linear-gradient(90deg, #10B981, #059669)',
                  tintBg: 'linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 100%)',
                  borderColor: '#A7F3D0',
                  iconBg: '#D1FAE5',
                  iconColor: '#047857',
                  Icon: CheckCircle2,
                }
              : toast.type === 'info'
              ? {
                  accent: '#2563EB',
                  gradient: 'linear-gradient(90deg, #3B82F6, #1D4ED8)',
                  tintBg: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
                  borderColor: '#BFDBFE',
                  iconBg: '#DBEAFE',
                  iconColor: '#1D4ED8',
                  Icon: Info,
                }
              : toast.type === 'warning'
              ? {
                  accent: '#D97706',
                  gradient: 'linear-gradient(90deg, #F59E0B, #B45309)',
                  tintBg: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)',
                  borderColor: '#FDE68A',
                  iconBg: '#FEF3C7',
                  iconColor: '#B45309',
                  Icon: AlertTriangle,
                }
              : {
                  accent: '#E11D48',
                  gradient: 'linear-gradient(90deg, #F43F5E, #BE123C)',
                  tintBg: 'linear-gradient(135deg, #FFFFFF 0%, #FFF1F2 100%)',
                  borderColor: '#FECDD3',
                  iconBg: '#FFE4E6',
                  iconColor: '#BE123C',
                  Icon: XCircle,
                };

          const IconComponent = palette.Icon;

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 16,
                background: palette.tintBg,
                color: '#14161A',
                border: `1.5px solid ${palette.borderColor}`,
                borderLeft: `5px solid ${palette.accent}`,
                boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.28), 0 4px 12px rgba(15, 23, 42, 0.08)',
                padding: '12px 13px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 11,
                fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif',
                animation: toast.exiting
                  ? `fvToastSlideOut ${EXIT_ANIMATION_MS}ms cubic-bezier(0.4, 0, 1, 1) forwards`
                  : 'fvToastSlideIn 340ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: palette.iconBg,
                  color: palette.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                  animation: 'fvToastIconPop 420ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <IconComponent size={18} strokeWidth={2.3} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35, color: '#0F172A' }}>
                  {toast.title}
                </div>
                {toast.message && (
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      lineHeight: 1.45,
                      color: '#475569',
                      marginTop: 2.5,
                    }}
                  >
                    {toast.message}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Đóng thông báo"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.06)',
                  border: 'none',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={13} />
              </button>

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3.5,
                  background: palette.gradient,
                  transformOrigin: 'left center',
                  animation: `fvToastProgress ${toast.durationMs}ms linear forwards`,
                }}
              />
            </div>
          );
        })}
      </div>
    </>
  );

  return createPortal(content, document.body);
};
