import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#F96100] text-white shadow-xs hover:bg-[#d65300] hover:scale-[1.02] active:scale-[0.98]',
        navy: 'bg-[#130C76] text-white shadow-xs hover:bg-[#0038A8] hover:scale-[1.02] active:scale-[0.98]',
        outline: 'border border-[#E5DFD5] bg-white hover:bg-gray-50 text-[#130C76]',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 text-gray-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-xs',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-13 px-8 text-base rounded-2xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
