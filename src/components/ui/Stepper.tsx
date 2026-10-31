import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  label,
  className = '',
}) => {
  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <span className="text-[13px] font-medium text-ink font-sans">{label}</span>}
      <div className="inline-flex items-center rounded-control border border-kraft/60 bg-paper overflow-hidden h-11 shadow-subtle">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-kraft/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Giảm"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="px-4 font-mono text-sm font-semibold text-ink select-none min-w-[60px] text-center">
          {value}
          {unit && <span className="text-xs text-ink-2 ml-1 font-normal">{unit}</span>}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-kraft/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Tăng"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
export default Stepper;
