import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-md px-4 py-2 font-medium transition-colors',
          variant === 'destructive'
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-neutral-900 text-white hover:bg-neutral-800',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button }; 