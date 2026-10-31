import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}) => {
  const switchId = id || (label ? `switch-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex items-center justify-between gap-3 select-none ${className}`}>
      {(label || description) && (
        <label htmlFor={switchId} className="cursor-pointer flex flex-col">
          {label && (
            <span className="text-sm font-medium text-ink font-sans leading-snug">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-ink-2 font-sans mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </label>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border transition-colors duration-smooth focus-visible:ring-2 focus-visible:ring-indigo disabled:opacity-50 disabled:cursor-not-allowed ${
          checked
            ? 'bg-indigo border-indigo'
            : 'bg-kraft/40 border-kraft/80'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow-subtle ring-0 transition duration-smooth ease-in-out mt-[1px] ml-[1px] ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
export default Switch;
