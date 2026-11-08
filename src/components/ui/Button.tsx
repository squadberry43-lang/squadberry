import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  to?: string;
}

type ButtonLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> &
  ButtonProps & { to?: string };

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  to,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary: 'bg-[#202124] text-white hover:bg-[#3c4043] focus:ring-[#202124]',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-500',
    outline: 'border-2 border-zinc-300 text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-500',
    ghost: 'text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const widthStyles = fullWidth ? 'w-full' : '';
  const allStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`;

  const isLoading = loading;
  const isDisabled = disabled || isLoading;

  const spinner = (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={allStyles}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
      >
        {isLoading && spinner}
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={allStyles}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && spinner}
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  to,
  ...props
}: ButtonLinkProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary: 'bg-[#202124] text-white hover:bg-[#3c4043] focus:ring-[#202124]',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-500',
    outline: 'border-2 border-zinc-300 text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-500',
    ghost: 'text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const widthStyles = fullWidth ? 'w-full' : '';
  const allStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`;

  return (
    <Link to={to || '#'} className={allStyles} {...props}>
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </Link>
  );
}

export default Button;
export const ButtonLinkDefault = ButtonLink;
