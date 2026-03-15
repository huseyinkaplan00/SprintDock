import React from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './app/routes/index.jsx'
import QueryProvider from './app/providers/query-client.jsx'
import ThemeProvider from './app/providers/theme-provider.jsx'
import SocketProvider from './app/providers/socket-provider.jsx'
import { ToastProvider } from './components/ui/toast.jsx'
import './styles/globals.css'

const root = createRoot(document.getElementById('root'))
root.render(
  <ThemeProvider>
    <QueryProvider>
      <ToastProvider>
        <SocketProvider>
          <AppRouter />
        </SocketProvider>
      </ToastProvider>
    </QueryProvider>
  </ThemeProvider>
)
