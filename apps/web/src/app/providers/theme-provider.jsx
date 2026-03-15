import { useEffect } from 'react'
import { useUiStore } from '../../store/ui.store.js'

export default function ThemeProvider({ children }) {
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return children
}
