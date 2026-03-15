import React from 'react'
import * as Toast from '@radix-ui/react-toast'
import { cn } from '../lib/cn.js'

const ToastContext = React.createContext(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [items, setItems] = React.useState([])

  const push = React.useCallback(({ title, description, variant = 'default' }) => {
    const normalizedTitle = String(title || '').trim()
    const normalizedDescription = String(description || '').trim()
    const now = Date.now()

    let existingId = ''
    setItems((prev) => {
      const duplicate = prev.find(
        (item) =>
          item.title === normalizedTitle &&
          item.description === normalizedDescription &&
          item.variant === variant &&
          now - item.createdAt < 2000
      )

      if (duplicate) {
        existingId = duplicate.id
        return prev
      }

      const id = crypto.randomUUID ? crypto.randomUUID() : String(now + Math.random())
      existingId = id
      const next = [
        ...prev,
        { id, title: normalizedTitle, description: normalizedDescription, variant, createdAt: now },
      ]
      return next.slice(-4)
    })

    return existingId
  }, [])

  const remove = React.useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const value = React.useMemo(() => ({ push, remove }), [push, remove])

  return (
    <ToastContext.Provider value={value}>
      <Toast.Provider swipeDirection="right">
        {children}
        {items.map((item) => (
          <Toast.Root
            key={item.id}
            open
            duration={3500}
            onOpenChange={(open) => {
              if (!open) remove(item.id)
            }}
            className={cn(
              'mb-2 rounded-lg border px-4 py-3 shadow-lg',
              item.variant === 'danger'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300'
                : 'border-border-light bg-white text-slate-900 dark:border-border-dark dark:bg-surface-dark dark:text-white'
            )}
          >
            {item.title ? (
              <Toast.Title className="text-sm font-semibold">{item.title}</Toast.Title>
            ) : null}
            {item.description ? (
              <Toast.Description className="text-xs text-slate-500 dark:text-slate-400">
                {item.description}
              </Toast.Description>
            ) : null}
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 z-[100] w-[320px] max-w-[90vw]" />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}
