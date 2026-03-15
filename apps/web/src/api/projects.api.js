import { api } from './client.js'

export const projectsApi = {
  list: () => api.get('/api/projects'),
  create: (payload) => api.post('/api/projects', payload),
  get: (id) => api.get(`/api/projects/${id}`),
  update: (id, payload) => api.patch(`/api/projects/${id}`, payload),
  remove: (id) => api.delete(`/api/projects/${id}`),
}
