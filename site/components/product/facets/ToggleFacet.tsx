'use client';

interface ToggleFacetProps {
  isActive: boolean;
  onToggle: () => void;
  label: string;
}

export default function ToggleFacet({ isActive, onToggle, label }: ToggleFacetProps) {
  return (
    <button
      role="switch"
      aria-checked={isActive}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
        isActive ? 'bg-charcoal' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          isActive ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
