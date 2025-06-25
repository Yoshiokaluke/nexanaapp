import { LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium text-neutral-700',
          className
        )}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label }; 