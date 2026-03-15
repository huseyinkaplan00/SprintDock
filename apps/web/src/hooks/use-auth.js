import { useAuthStore } from '../store/auth.store.js'

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return {
    accessToken,
    refreshToken,
    user,
    hydrated,
    logout: clearAuth,
    isAuthenticated: Boolean(accessToken || refreshToken),
  }
}
