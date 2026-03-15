import { api } from './client.js'

export const sessionsApi = {
  list: () => api.get('/api/sessions'),
  revoke: (sessionId) => api.post('/api/sessions/revoke', { sessionId }),
  revokeOthers: () => api.post('/api/sessions/revoke-others', {}),
}
