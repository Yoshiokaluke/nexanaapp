import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const Card = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white shadow-sm',
        className
      )}
      {...props}
    />
  );
};

const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('p-6', className)}
      {...props}
    />
  );
};

const CardTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn('text-2xl font-semibold', className)}
      {...props}
    />
  );
};

const CardContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('p-6 pt-0', className)}
      {...props}
    />
  );
};

export { Card, CardHeader, CardTitle, CardContent }; 