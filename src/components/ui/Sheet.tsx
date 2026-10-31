import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: 'peek' | 'half' | 'full';
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  height = 'half',
}) => {
  if (!isOpen) return null;

  const heightStyles = {
    peek: 'h-[180px]',
    half: 'h-[55vh]',
    full: 'h-[90vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/35 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content Container */}
      <div
        className={`relative w-full ${heightStyles[height]} bg-paper-2 rounded-t-modal border-t border-kraft/70 shadow-modal z-10 flex flex-col animate-in slide-in-from-bottom duration-smooth overflow-hidden`}
      >
        {/* Grab Handle */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1 bg-paper border-b border-kraft/30">
          <div className="w-12 h-1 bg-kraft rounded-pill" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-kraft/40 bg-paper">
            <div>
              {title && (
                <h4 className="font-sans text-sm font-semibold text-ink">{title}</h4>
              )}
              {subtitle && <p className="text-xs text-ink-2 mt-0.5">{subtitle}</p>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 text-ink-2 hover:text-ink w-8 h-8 rounded-control"
              icon={<X className="w-4 h-4" />}
            />
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
export default Sheet;
