import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  hint,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const generatedId = id || `select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return (
    <div className={`flex flex-col gap-1.5 font-sans ${className}`}>
      <label htmlFor={generatedId} className="font-medium text-ink text-[13px]">
        {label}
      </label>

      <div className="relative flex items-center">
        <select
          id={generatedId}
          disabled={disabled}
          className={`w-full h-11 pl-3.5 pr-10 bg-paper text-ink font-sans text-sm rounded-control border appearance-none transition-all duration-smooth outline-none cursor-pointer ${
            error
              ? 'border-vermilion focus:ring-1 focus:ring-vermilion'
              : 'border-kraft/60 focus:border-indigo focus:ring-1 focus:ring-indigo/40'
          } disabled:bg-kraft/20 disabled:cursor-not-allowed`}
          {...props}
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 w-4 h-4 text-ink-2 pointer-events-none" />
      </div>

      {hint && !error && <span className="text-xs text-ink-2 leading-relaxed">{hint}</span>}
      {error && <span className="text-xs text-vermilion font-medium">{error}</span>}
    </div>
  );
};
export default Select;
