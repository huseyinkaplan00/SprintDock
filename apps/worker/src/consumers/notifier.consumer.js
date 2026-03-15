import { notifyRealtime } from '../services/notify.js'

const SOCKET_EVENT_BY_ROUTING_KEY = {
  task_created: 'task.updated',
  task_assigned: 'task.updated',
  comment_added: 'comment.added',
}

export function resolveSocketEvent(routingKey) {
  return SOCKET_EVENT_BY_ROUTING_KEY[routingKey] || null
}

export async function handleRealtimeNotification({ routingKey, payload }) {
  const socketEvent = resolveSocketEvent(routingKey)
  if (!socketEvent || !payload?.projectId) return

  await notifyRealtime({
    projectId: payload.projectId,
    event: socketEvent,
    payload,
  })
}
