import React, { useRef, useEffect } from 'react';

interface CheckoutStepProps {
  step: number;
  title: string;
  activeStep: number;
  editLabel?: string;
  onEdit?: () => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
}

export default function CheckoutStep({
  step,
  title,
  activeStep,
  editLabel,
  onEdit,
  summary,
  children,
}: CheckoutStepProps) {
  const completed = activeStep > step;
  const active = activeStep === step;

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [active]);

  return (
    <div ref={ref} className="border-border scroll-mt-24 rounded-sm border bg-white">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              completed || active
                ? 'bg-charcoal text-white'
                : 'border-border text-charcoal-light border'
            }`}
          >
            {completed ? '✓' : step}
          </div>
          <span
            className={`font-medium ${activeStep >= step ? 'text-charcoal' : 'text-charcoal-light'}`}
          >
            {title}
          </span>
        </div>
        {completed && onEdit && editLabel && (
          <button
            onClick={onEdit}
            className="text-charcoal-light hover:text-charcoal text-xs underline"
          >
            {editLabel}
          </button>
        )}
      </div>

      {completed && summary && (
        <div className="border-border border-t px-5 pt-4 pb-5">{summary}</div>
      )}

      {active && <div className="border-border border-t">{children}</div>}
    </div>
  );
}
