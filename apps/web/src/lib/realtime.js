export function normalizeRealtimePayload(payload) {
  const raw = payload || {}
  const projectId = raw.projectId ? String(raw.projectId) : ''
  const taskId = raw.taskId ? String(raw.taskId) : raw.id ? String(raw.id) : ''

  return { projectId, taskId, raw }
}
