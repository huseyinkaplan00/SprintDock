import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '../lib/cn.js'

export function Modal({ trigger, title, description, children, footer, open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border-light bg-white p-6 shadow-xl',
            'dark:border-border-dark dark:bg-surface-dark'
          )}
        >
          {title ? (
            <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </Dialog.Title>
          ) : null}
          {description ? (
            <Dialog.Description className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </Dialog.Description>
          ) : null}
          <div className="mt-4">{children}</div>
          {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
