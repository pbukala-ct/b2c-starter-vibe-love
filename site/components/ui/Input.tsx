import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id: idProp, ...props }, ref) => {
    // Generate a stable unique ID so the <label htmlFor> can reference the <input id>.
    // This enables Playwright's getByLabel() and improves screen-reader accessibility.
    const generatedId = useId();
    const id = idProp ?? (label ? generatedId : undefined);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-charcoal-light text-xs font-medium tracking-wider uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          {...props}
          className={`border-border focus:border-charcoal placeholder:text-charcoal-light/60 w-full rounded-sm border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none ${error ? 'border-red-400' : ''} ${className}`}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
