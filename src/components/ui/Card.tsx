import { HTMLAttributes, forwardRef, ElementType } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: ElementType;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = 'md', as: Tag = 'div', className = '', children, ...props }, ref) => {
    const paddingMap = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    const base = 'bg-white rounded-lg border border-zinc-200 shadow-soft-sm';
    const hoverStyle = hover ? 'transition-all duration-200 hover:border-zinc-300 hover:shadow-soft-md hover:-translate-y-0.5' : '';

    return (
      <Tag ref={ref} className={`${base} ${hoverStyle} ${paddingMap[padding]} ${className}`} {...props}>
        {children}
      </Tag>
    );
  }
);

Card.displayName = 'Card';
