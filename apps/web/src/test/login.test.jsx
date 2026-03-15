import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/Login.jsx'
import { ToastProvider } from '../components/ui/toast.jsx'

describe('LoginPage', () => {
  test('giris basligini ve OTP gonder eylemini gosterir', () => {
    render(
      <ToastProvider>
        <MemoryRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <LoginPage />
        </MemoryRouter>
      </ToastProvider>
    )

    expect(screen.getByText("SprintDock'a Giris Yap")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'OTP Gonder' })).toBeInTheDocument()
  })
})
