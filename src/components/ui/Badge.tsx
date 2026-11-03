import React from 'react';

export type BadgeVariant = 'kraft' | 'indigo' | 'vermilion' | 'moss' | 'ochre' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'kraft',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-sans font-medium rounded-pill border select-none transition-colors';

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 leading-none',
    md: 'text-xs px-2.5 py-1 leading-none',
  };

  const variantStyles = {
    kraft: 'bg-kraft/20 text-ink border-kraft/60',
    indigo: 'bg-indigo/10 text-indigo border-indigo/25',
    vermilion: 'bg-vermilion/10 text-vermilion border-vermilion/25',
    moss: 'bg-moss/10 text-moss border-moss/25',
    ochre: 'bg-ochre/15 text-ochre border-ochre/30',
    outline: 'bg-transparent text-ink border-kraft/80',
  };

  const dotColors = {
    kraft: 'bg-ink-2',
    indigo: 'bg-indigo',
    vermilion: 'bg-vermilion',
    moss: 'bg-moss',
    ochre: 'bg-ochre',
    outline: 'bg-ink',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`} />
      )}
      <span>{children}</span>
    </span>
  );
};
export default Badge;
