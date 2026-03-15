import React from 'react'
import logo from '../../assets/logo.svg'

export function LoadingScreen({ label = 'Yukleniyor...' }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-grid-pattern">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-cyan-400/[0.06] dark:from-primary/[0.18] dark:to-cyan-400/[0.1]" />
      <div className="relative z-10 flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-surface-light/80 p-6 shadow-glass backdrop-blur dark:border-white/10 dark:bg-surface-dark/70 dark:shadow-glass-dark">
        <div className="logo-spinner-wrap relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
          <img alt="SprintDock" className="logo-float h-9 w-9" src={logo} />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
      </div>
    </div>
  )
}
