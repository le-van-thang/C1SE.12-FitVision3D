import React from 'react';

export interface TapeStep {
  id: number | string;
  label: string;
}

export interface TapeMeasureProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: TapeStep[];
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const TapeMeasureProgress: React.FC<TapeMeasureProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  className = '',
}) => {
  const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100));

  return (
    <div className={`w-full rounded-card bg-paper-2 border border-kraft/60 p-4 shadow-card ${className}`}>
      {/* Progress Tape Bar */}
      <div className="relative h-9 bg-kraft/15 rounded-control border border-kraft/50 overflow-hidden flex items-center select-none">
        {/* Subtle millimeter ruler ticks */}
        <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-25">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className={`w-[1px] bg-ink ${
                i % 8 === 0 ? 'h-4' : i % 4 === 0 ? 'h-2.5' : 'h-1.5'
              }`}
            />
          ))}
        </div>

        {/* Progress Fill Indicator */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-indigo/10 border-r-2 border-indigo transition-all duration-smooth z-10"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Interactive Step Markers on Tape */}
        <div className="relative z-20 w-full flex justify-between items-center px-3">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick && onStepClick(stepNumber)}
                disabled={!onStepClick || stepNumber > currentStep}
                className="group flex flex-col items-center focus:outline-none"
                title={step.label}
              >
                <div
                  className={`w-5 h-5 rounded-pill flex items-center justify-center text-[10px] font-mono font-medium transition-all duration-smooth ${
                    isCurrent
                      ? 'bg-indigo text-white shadow-subtle ring-2 ring-indigo/30'
                      : isCompleted
                      ? 'bg-moss text-white'
                      : 'bg-paper text-ink-2 border border-kraft/60'
                  }`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Label below */}
      <div className="flex items-center justify-between text-xs text-ink-2 mt-2.5 px-0.5">
        <span className="font-sans">
          {steps[currentStep - 1]?.label || ''}
        </span>
        <span className="font-mono text-[11px]">
          {currentStep}/{totalSteps}
        </span>
      </div>
    </div>
  );
};

export interface FitRulerProps {
  label: string;
  userValue: number;
  minRange: number;
  maxRange: number;
  unit?: string;
  easeTolerance?: number;
  className?: string;
}

export const FitRuler: React.FC<FitRulerProps> = ({
  label,
  userValue,
  minRange,
  maxRange,
  unit = 'cm',
  className = '',
}) => {
  const span = Math.max(10, maxRange - minRange);
  const displayMin = minRange - span * 0.25;
  const displayMax = maxRange + span * 0.25;
  const totalDisplay = displayMax - displayMin;

  const userPercent = Math.min(100, Math.max(0, ((userValue - displayMin) / totalDisplay) * 100));
  const rangeStartPercent = Math.min(100, Math.max(0, ((minRange - displayMin) / totalDisplay) * 100));
  const rangeWidthPercent = Math.min(100, Math.max(0, ((maxRange - minRange) / totalDisplay) * 100));

  const isInside = userValue >= minRange && userValue <= maxRange;
  const delta = userValue - (minRange + maxRange) / 2;

  return (
    <div className={`p-4 rounded-card bg-paper-2 border border-kraft/60 shadow-card font-sans text-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-ink text-[13px]">{label}</span>
        <div className="font-mono text-[12px] flex items-center gap-2">
          <span className="text-ink font-semibold">{userValue.toFixed(1)} {unit}</span>
          <span className={`px-2 py-0.5 rounded-pill text-[10px] font-sans border ${
            isInside
              ? 'bg-moss/10 text-moss border-moss/20'
              : 'bg-ochre/15 text-ochre border-ochre/30'
          }`}>
            {isInside ? 'Chuẩn phom' : delta > 0 ? `+${delta.toFixed(1)} ${unit}` : `${delta.toFixed(1)} ${unit}`}
          </span>
        </div>
      </div>

      {/* Ruler Track */}
      <div className="relative h-6 bg-kraft/15 rounded-control border border-kraft/40 overflow-hidden my-1">
        {/* Subtle Ticks */}
        <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`w-[1px] bg-ink ${i % 4 === 0 ? 'h-full' : 'h-1.5'}`} />
          ))}
        </div>

        {/* Valid size range target window */}
        <div
          className="absolute top-0 bottom-0 bg-moss/15 border-x border-moss/40"
          style={{
            left: `${rangeStartPercent}%`,
            width: `${rangeWidthPercent}%`,
          }}
        />

        {/* User pointer needle */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-vermilion z-20"
          style={{ left: `${userPercent}%` }}
        >
          <div className="absolute -top-0.5 -left-[3px] w-2 h-2 rounded-full bg-vermilion" />
        </div>
      </div>

      <div className="flex justify-between text-[11px] font-mono text-ink-2 mt-1">
        <span>{minRange.toFixed(1)}</span>
        <span className="text-vermilion font-medium">● Bạn: {userValue.toFixed(1)}</span>
        <span>{maxRange.toFixed(1)}</span>
      </div>
    </div>
  );
};
