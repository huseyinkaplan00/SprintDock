import { env } from '../config/env.js'
import { getAuthState, useAuthStore } from '../store/auth.store.js'
import { parseApiError } from '../lib/api-error.js'

function baseHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (/ngrok-free\.app/i.test(env.apiUrl)) {
    headers['ngrok-skip-browser-warning'] = 'true'
  }
  return headers
}

export async function requestOtp(email) {
  const res = await fetch(`${env.apiUrl}/api/auth/request-otp`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const parsed = await parseApiError(res, 'OTP could not be sent.')
    const err = new Error(parsed.message)
    err.status = parsed.status
    err.retryAfterSec = parsed.retryAfterSec
    throw err
  }
  return res.json()
}

export async function verifyOtp(email, otp) {
  const res = await fetch(`${env.apiUrl}/api/auth/verify-otp`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({ email, otp }),
  })
  if (!res.ok) {
    const parsed = await parseApiError(res, 'OTP could not be verified.')
    const err = new Error(parsed.message)
    err.status = parsed.status
    err.retryAfterSec = parsed.retryAfterSec
    throw err
  }
  const data = await res.json()
  useAuthStore.getState().setAuth(data)
  return data
}

export async function refreshToken() {
  const { refreshToken: token } = getAuthState()
  if (!token) return false
  const res = await fetch(`${env.apiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({ refreshToken: token }),
  })
  if (!res.ok) {
    useAuthStore.getState().clearAuth()
    return false
  }
  const data = await res.json()
  useAuthStore.getState().setAuth({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: getAuthState().user,
  })
  return true
}
