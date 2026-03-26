'use client';

import { useEffect, ReactNode } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  position?: 'left' | 'right';
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
}: DrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 ${position === 'right' ? 'right-0' : 'left-0'} z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-border flex shrink-0 items-center justify-between border-b p-5">
          <h2 className="text-charcoal text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-charcoal-light hover:text-charcoal transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && <div className="shrink-0">{footer}</div>}
      </aside>
    </>
  );
}
