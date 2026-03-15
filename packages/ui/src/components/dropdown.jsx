import React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '../lib/cn.js'

export function Dropdown({ trigger, children, align = 'end', sideOffset = 8 }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={sideOffset}
          className="z-50 min-w-44 rounded-lg border border-border-light bg-white p-1 shadow-lg dark:border-border-dark dark:bg-surface-dark"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function DropdownItem({ className, inset = false, ...props }) {
  return (
    <DropdownMenu.Item
      className={cn(
        'flex cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm text-slate-700 outline-none focus:bg-slate-100 dark:text-slate-200 dark:focus:bg-white/10',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
}

export const DropdownLabel = DropdownMenu.Label
export const DropdownSeparator = DropdownMenu.Separator
