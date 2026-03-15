import { api } from './client.js'

export const commentsApi = {
  list: (taskId) => api.get(`/api/comments?taskId=${taskId}`),
  create: (payload) => api.post('/api/comments', payload),
}
