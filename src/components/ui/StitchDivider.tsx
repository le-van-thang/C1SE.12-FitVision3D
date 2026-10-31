import React from 'react';

export interface StitchDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  variant?: 'kraft' | 'vermilion' | 'indigo';
  orientation?: 'horizontal' | 'vertical';
}

export const StitchDivider: React.FC<StitchDividerProps> = ({
  label,
  variant = 'kraft',
  orientation = 'horizontal',
  className = '',
  ...props
}) => {
  const colorMap = {
    kraft: 'border-kraft text-ink-2',
    vermilion: 'border-vermilion/50 text-vermilion',
    indigo: 'border-indigo/50 text-indigo',
  };

  if (orientation === 'vertical') {
    return (
      <div
        className={`inline-block h-full border-r border-dashed ${colorMap[variant]} mx-2 ${className}`}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        className={`relative flex items-center justify-center my-6 ${className}`}
        {...props}
      >
        <div className={`absolute inset-0 flex items-center`}>
          <div className={`w-full border-t border-dashed ${colorMap[variant]}`} />
        </div>
        <div className="relative px-3 bg-paper text-[11px] font-mono uppercase tracking-wider border border-kraft bg-paper-2">
          {label}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full border-t border-dashed my-4 ${colorMap[variant]} ${className}`}
      {...props}
    />
  );
};
