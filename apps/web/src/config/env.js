const isBrowser = typeof window !== 'undefined'
const fallbackOrigin = isBrowser ? window.location.origin : 'http://localhost:4000'

export const env = {
  apiUrl: import.meta.env.VITE_API_URL || fallbackOrigin,
  socketUrl: import.meta.env.VITE_SOCKET_URL || fallbackOrigin,
}
