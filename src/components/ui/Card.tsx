import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'paper' | 'paper-2' | 'kraft';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'paper-2',
  noPadding = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    'paper': 'bg-paper',
    'paper-2': 'bg-paper-2',
    'kraft': 'bg-kraft/15',
  };

  return (
    <div
      className={`rounded-card border border-kraft/60 ${variantStyles[variant]} shadow-card transition-shadow ${
        noPadding ? '' : 'p-5'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-kraft/40 pb-4 mb-4 ${className}`}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-control border border-kraft/60 bg-paper flex items-center justify-center text-indigo shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-sans text-base font-semibold text-ink leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`border-t border-kraft/40 pt-4 mt-4 flex items-center justify-between text-xs text-ink-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
