import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUiStore = create(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'sprintdock-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
