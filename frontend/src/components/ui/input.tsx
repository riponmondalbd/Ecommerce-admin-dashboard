import { forwardRef, useMemo } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex border rounded-md text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4',
        lg: 'h-10 px-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
  as?: boolean;
  asChild?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, size, asChild = false, ...props }, ref) => {
  const slot = asChild ? Slot : 'input';
  return (
    <slot ref={ref} className={inputVariants({ size, className })} {...props} />
  );
});

export default Input;
