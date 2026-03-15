import { emitToProject } from '../index.js'

export function emitTaskUpdated(projectId, payload) {
  emitToProject(projectId, 'task.updated', payload)
}

export function emitCommentAdded(projectId, payload) {
  emitToProject(projectId, 'comment.added', payload)
}
