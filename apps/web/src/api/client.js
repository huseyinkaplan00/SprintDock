import { env } from '../config/env.js'
import { getAuthState } from '../store/auth.store.js'
import { refreshToken as refreshTokenApi } from './auth.api.js'
import { parseResponseError } from '../lib/api-error.js'

function buildHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  if (/ngrok-free\.app/i.test(env.apiUrl)) {
    headers['ngrok-skip-browser-warning'] = 'true'
  }

  return headers
}

async function request(method, path, body) {
  const url = `${env.apiUrl}${path}`
  const { accessToken } = getAuthState()
  const headers = buildHeaders(accessToken)

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    const refreshed = await refreshTokenApi()
    if (!refreshed) throw new Error('Your session expired. Please sign in again.')
    return request(method, path, body)
  }

  if (!res.ok) {
    const message = await parseResponseError(res)
    throw new Error(message)
  }

  return res.json()
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
}
