import React from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const heightStyles = size === 'sm' ? 'h-9 p-0.5 text-xs' : 'h-11 p-1 text-sm';

  return (
    <div
      className={`inline-flex items-center rounded-control bg-kraft/20 border border-kraft/60 select-none ${heightStyles} ${className}`}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-1.5 px-3 h-full rounded-[8px] font-sans font-medium transition-all duration-smooth ${
              isSelected
                ? 'bg-paper text-indigo shadow-subtle border border-kraft/40'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
export default SegmentedControl;
