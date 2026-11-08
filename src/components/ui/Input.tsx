import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || props.name || generatedId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">{leftIcon}</div>}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-iris/40 focus:border-iris transition-all duration-200 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-crimson focus:ring-crimson/40 focus:border-crimson' : 'border-zinc-300'
            } ${className}`}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">{rightIcon}</div>}
        </div>
        {error && <p id={`${inputId}-error`} className="mt-1.5 text-xs text-crimson">{error}</p>}
        {hint && !error && <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
