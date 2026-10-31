import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`rounded-card border border-dashed border-kraft/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-control bg-kraft/20 border border-kraft/60 flex items-center justify-center text-ink-2 mb-3.5">
          {icon}
        </div>
      )}
      <h3 className="font-sans text-base font-semibold text-ink leading-snug">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-ink-2 mt-1 leading-relaxed max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
export default EmptyState;
