import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variants = {
  default: 'bg-zinc-100 text-zinc-700',
  success: 'bg-sprout/20 text-sprout',
  warning: 'bg-gold/20 text-gold',
  danger: 'bg-crimson/20 text-crimson',
  info: 'bg-sky-100 text-sky-700',
  neutral: 'bg-zinc-200 text-zinc-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 font-medium rounded-md ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
