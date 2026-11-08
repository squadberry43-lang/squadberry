import { TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
  required?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(props, ref) {
  const { label, error, helper, fullWidth, className = '', id, required, ...rest } = props;
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-zinc-600 mb-1.5">
          {label}
          {required && <span className="text-crimson ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`w-full ${fullWidth ? 'w-full' : ''} px-3 py-2 rounded-[2.5rem] border ${error ? 'border-crimson' : 'border-zinc-300'} bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent min-h-[80px] resize-y transition-colors ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-crimson">{error}</p>
      )}
      {helper && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-zinc-400">{helper}</p>
      )}
    </div>
  );
});
