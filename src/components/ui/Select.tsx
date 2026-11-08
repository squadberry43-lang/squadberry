import { HTMLAttributes, forwardRef, useId } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<HTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  const { label, error, helper, options, value, onChange, disabled, className = '', id, ...rest } = props;
  const generatedId = useId();
  const inputId = id || generatedId;
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-zinc-600 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border ${error ? 'border-crimson' : 'border-zinc-300'} bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-iris/30 focus:border-iris transition-colors appearance-none ${className}`}
        style={{ backgroundImage: `url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-crimson">{error}</p>
      )}
      {helper && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-zinc-400">{helper}</p>
      )}
    </div>
  );
});
