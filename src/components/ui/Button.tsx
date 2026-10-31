import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium rounded-control select-none transition-all duration-smooth border outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo';

  const sizeStyles = {
    sm: 'h-10 text-xs px-3.5 gap-2',
    md: 'h-11 text-sm px-4 gap-2',
    lg: 'h-13 text-base px-6 gap-2.5 font-medium',
  };

  const variantStyles = {
    primary:
      'bg-indigo text-white border-transparent shadow-cta hover:brightness-105 active:shadow-cta-pressed',
    accent:
      'bg-vermilion text-white border-transparent shadow-cta hover:brightness-105 active:shadow-cta-pressed',
    secondary:
      'bg-paper-2 text-ink border-kraft/60 shadow-subtle hover:bg-kraft/25 hover:border-kraft active:bg-kraft/40',
    outline:
      'bg-transparent text-ink border-kraft/80 shadow-subtle hover:bg-paper-2 active:bg-kraft/20',
    ghost:
      'bg-transparent text-ink-2 border-transparent hover:text-ink hover:bg-kraft/20 active:bg-kraft/30',
    danger:
      'bg-vermilion/10 text-vermilion border-vermilion/25 hover:bg-vermilion hover:text-white active:bg-vermilion-hover',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
};
export default Button;
