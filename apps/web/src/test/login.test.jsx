import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/Login.jsx'
import { ToastProvider } from '../components/ui/toast.jsx'

describe('LoginPage', () => {
  test('renders the sign-in title and send OTP action', () => {
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

    expect(screen.getByText('Sign in to SprintDock')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send OTP' })).toBeInTheDocument()
  })
})
