import React from 'react';

export interface DeckleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  ticketNumber?: string;
  watermark?: string;
}

export const DeckleCard: React.FC<DeckleCardProps> = ({
  children,
  ticketNumber,
  watermark = 'ISO 8559-1 DOSSIER',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative bg-paper-2 border border-ink p-6 shadow-hard overflow-hidden ${className}`}
      {...props}
    >
      {/* Sawtooth / Perforated stamp edge decoration on top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex justify-between overflow-hidden opacity-60">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-2 h-1.5 bg-paper -mt-1 rounded-b-full shrink-0" />
        ))}
      </div>

      {/* Ticket header watermark */}
      <div className="flex items-center justify-between border-b border-dashed border-kraft pb-3 mb-4 text-[10px] font-mono uppercase text-ink-2">
        <span className="flex items-center gap-1.5 font-bold tracking-widest text-indigo">
          <span className="w-1.5 h-1.5 bg-vermilion inline-block" /> {watermark}
        </span>
        {ticketNumber && (
          <span className="border border-kraft px-1.5 py-0.5 bg-paper">
            NO. {ticketNumber}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Sawtooth perforated stamp edge decoration on bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 flex justify-between overflow-hidden opacity-60">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-2 h-1.5 bg-paper -mb-1 rounded-t-full shrink-0" />
        ))}
      </div>
    </div>
  );
};
