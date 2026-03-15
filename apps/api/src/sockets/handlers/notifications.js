import { emitToProject } from '../index.js'

export function emitNotification(projectId, payload) {
  emitToProject(projectId, 'notification.added', payload)
}
