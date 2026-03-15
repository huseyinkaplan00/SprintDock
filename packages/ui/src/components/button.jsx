import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../lib/cn.js'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary to-blue-600 text-white shadow-[0_10px_24px_-14px_rgba(44,88,255,0.9)] hover:from-blue-600 hover:to-primary',
        secondary:
          'bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
        ghost:
          'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10',
        outline:
          'border border-border-light bg-white/90 text-slate-800 hover:border-primary/40 hover:bg-slate-50 dark:border-border-dark dark:bg-transparent dark:text-white dark:hover:bg-white/5',
        danger:
          'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_10px_24px_-14px_rgba(239,68,68,0.9)] hover:from-red-600 hover:to-rose-600',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }
