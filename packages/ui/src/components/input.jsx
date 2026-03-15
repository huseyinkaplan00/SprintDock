import React from 'react'
import { cn } from '../lib/cn.js'

export const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      className={cn(
        // iOS Safari zooms on focus when font-size < 16px. Keep inputs >= 16px.
        'h-10 w-full rounded-lg border border-border-light bg-white px-3 text-[16px] text-[#111218] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-border-dark dark:bg-surface-dark dark:text-white',
        className
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
})

Input.displayName = 'Input'
