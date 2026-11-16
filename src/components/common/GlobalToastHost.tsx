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

      const timeout = detail.durationMs ?? 4500;
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, timeout);
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleToast);
  }, []);

  if (toasts.length === 0 || typeof document === 'undefined') return null;

  const content = (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const palette =
          toast.type === 'success'
            ? {
                accent: '#10B981',
                iconBg: 'rgba(16, 185, 129, 0.16)',
                iconColor: '#34D399',
                Icon: CheckCircle2,
              }
            : toast.type === 'info'
            ? {
                accent: '#3B82F6',
                iconBg: 'rgba(59, 130, 246, 0.18)',
                iconColor: '#60A5FA',
                Icon: Info,
              }
            : toast.type === 'warning'
            ? {
                accent: '#F59E0B',
                iconBg: 'rgba(245, 158, 11, 0.18)',
                iconColor: '#FBBF24',
                Icon: AlertTriangle,
              }
            : {
                accent: '#EF4444',
                iconBg: 'rgba(239, 68, 68, 0.18)',
                iconColor: '#F87171',
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
              backgroundColor: '#14171C',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.45)',
              padding: '13px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: palette.iconBg,
                border: `1px solid ${palette.accent}55`,
                color: palette.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <IconComponent size={18} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35, color: '#FFFFFF' }}>
                {toast.title}
              </div>
              {toast.message && (
                <div style={{ fontSize: 11.5, fontWeight: 500, lineHeight: 1.45, color: '#CBD5E1', marginTop: 3 }}>
                  {toast.message}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Đóng thông báo"
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#94A3B8',
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
                height: 3,
                backgroundColor: palette.accent,
              }}
            />
          </div>
        );
      })}
    </div>
  );

  return createPortal(content, document.body);
};
