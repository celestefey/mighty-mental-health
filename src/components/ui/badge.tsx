import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[#BA3D00]/10 text-[#BA3D00] border border-[#BA3D00]/20',
        navy: 'bg-[#130C76]/10 text-[#130C76] border border-[#130C76]/20',
        success: 'bg-green-100 text-green-800 border border-green-200',
        warning: 'bg-amber-100 text-amber-900 border border-amber-200',
        destructive: 'bg-red-100 text-red-800 border border-red-200',
        outline: 'text-gray-700 border border-gray-300 bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
