import React from 'react';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit?: string;
  error?: string;
  hint?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  unit,
  error,
  hint,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const generatedId = id || `field-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return (
    <div className={`flex flex-col gap-1.5 font-sans ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <label
          htmlFor={generatedId}
          className="font-medium text-ink text-[13px]"
        >
          {label}
        </label>
      </div>

      <div className="relative flex items-center">
        <input
          id={generatedId}
          disabled={disabled}
          className={`w-full h-11 px-3.5 bg-paper text-ink font-sans text-sm rounded-control border transition-all duration-smooth outline-none ${
            error
              ? 'border-vermilion focus:ring-1 focus:ring-vermilion'
              : 'border-kraft/60 focus:border-indigo focus:ring-1 focus:ring-indigo/40'
          } ${unit ? 'pr-12' : ''} disabled:bg-kraft/20 disabled:cursor-not-allowed`}
          {...props}
        />
        {unit && (
          <span className="absolute right-3.5 font-mono text-xs text-ink-2 bg-kraft/20 px-1.5 py-0.5 rounded-[4px] border border-kraft/40 pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>

      {hint && !error && (
        <span className="text-xs text-ink-2 font-sans leading-relaxed">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-vermilion font-medium flex items-center gap-1">
          {error}
        </span>
      )}
    </div>
  );
};
export default Field;
