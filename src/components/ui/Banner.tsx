import React from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success';

export interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const variantStyles = {
    info: 'bg-indigo/8 border-indigo/25 text-ink',
    warning: 'bg-ochre/12 border-ochre/30 text-ink',
    error: 'bg-vermilion/10 border-vermilion/25 text-ink',
    success: 'bg-moss/10 border-moss/25 text-ink',
  };

  const iconMap = {
    info: <Info className="w-4 h-4 text-indigo shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-ochre shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-vermilion shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={`rounded-control border p-4 text-sm font-sans flex items-start justify-between gap-3 ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{iconMap[variant]}</span>
        <div className="space-y-0.5">
          {title && <h4 className="font-medium text-ink leading-tight">{title}</h4>}
          <div className="text-ink-2 text-xs leading-relaxed">{children}</div>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-ink-2 hover:text-ink -mr-1 -mt-1 p-1 rounded-control hover:bg-kraft/20 transition-colors"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
export default Banner;
