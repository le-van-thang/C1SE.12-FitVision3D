import React from 'react';

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'vermilion' | 'indigo' | 'moss' | 'ochre' | 'kraft';
  title?: string;
  icon?: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({
  children,
  variant = 'indigo',
  title,
  icon,
  className = '',
  ...props
}) => {
  const borderColors = {
    vermilion: 'border-l-4 border-l-vermilion border-kraft bg-vermilion/5',
    indigo: 'border-l-4 border-l-indigo border-kraft bg-indigo/5',
    moss: 'border-l-4 border-l-moss border-kraft bg-moss/5',
    ochre: 'border-l-4 border-l-ochre border-kraft bg-ochre/5',
    kraft: 'border-l-4 border-l-kraft border-kraft bg-kraft/10',
  };

  const titleColors = {
    vermilion: 'text-vermilion',
    indigo: 'text-indigo',
    moss: 'text-moss',
    ochre: 'text-ochre',
    kraft: 'text-ink',
  };

  return (
    <div
      className={`p-3.5 sm:p-4 border font-sans text-xs sm:text-sm ${borderColors[variant]} ${className}`}
      {...props}
    >
      {(title || icon) && (
        <div className="flex items-center gap-2 font-bold mb-1.5">
          {icon && <span className="shrink-0">{icon}</span>}
          {title && <span className={`uppercase font-mono tracking-wider text-xs ${titleColors[variant]}`}>{title}</span>}
        </div>
      )}
      <div className="text-ink-2 leading-relaxed">{children}</div>
    </div>
  );
};
