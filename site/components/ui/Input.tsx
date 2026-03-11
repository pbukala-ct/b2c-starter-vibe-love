import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-charcoal-light uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          {...props}
          className={`w-full border border-border px-3 py-2.5 text-sm rounded-sm bg-white focus:outline-none focus:border-charcoal transition-colors placeholder:text-charcoal-light/60 ${error ? 'border-red-400' : ''} ${className}`}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
