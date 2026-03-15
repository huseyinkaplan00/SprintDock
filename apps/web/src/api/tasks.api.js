import { api } from './client.js'

export const tasksApi = {
  list: (projectId) => api.get(projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks'),
  search: (query) => api.get(`/api/tasks?q=${encodeURIComponent(query)}`),
  create: (payload) => api.post('/api/tasks', payload),
  get: (id) => api.get(`/api/tasks/${id}`),
  update: (id, payload) => api.patch(`/api/tasks/${id}`, payload),
  remove: (id) => api.delete(`/api/tasks/${id}`),
  removeMany: (taskIds) => api.post('/api/tasks/bulk-delete', { taskIds }),
}
