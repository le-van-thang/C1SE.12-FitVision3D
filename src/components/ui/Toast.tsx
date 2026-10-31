import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 3500 }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const typeMap = {
            success: {
              border: 'border-moss/30 bg-paper-2 text-moss',
              icon: <CheckCircle2 className="w-4 h-4 text-moss shrink-0 mt-0.5" />,
            },
            error: {
              border: 'border-vermilion/30 bg-paper-2 text-vermilion',
              icon: <AlertCircle className="w-4 h-4 text-vermilion shrink-0 mt-0.5" />,
            },
            info: {
              border: 'border-indigo/30 bg-paper-2 text-indigo',
              icon: <Info className="w-4 h-4 text-indigo shrink-0 mt-0.5" />,
            },
          };

          const style = typeMap[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 border rounded-card shadow-modal flex items-start justify-between gap-3 ${style.border} animate-in slide-in-from-bottom duration-smooth`}
            >
              <div className="flex items-start gap-3">
                {style.icon}
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-ink font-sans">
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className="text-xs text-ink-2 leading-relaxed font-sans">
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-ink-2 hover:text-ink -mr-1 -mt-1 p-1 rounded-control hover:bg-kraft/20 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
