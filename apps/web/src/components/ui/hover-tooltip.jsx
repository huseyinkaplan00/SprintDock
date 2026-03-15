import React from 'react'

export function HoverTooltip({ content, children }) {
  if (!content) return children

  return (
    <span className="group/tooltip relative inline-flex">
      <span className="inline-flex">{children}</span>
      <span className="pointer-events-none absolute left-1/2 top-0 z-50 mb-2 w-max -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-md border border-border-light bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 dark:border-border-dark dark:bg-slate-100 dark:text-slate-900">
        {content}
      </span>
    </span>
  )
}
