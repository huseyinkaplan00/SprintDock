import { publishEvent } from '../../events/publisher.js'

export function publishTaskCreated(payload) {
  publishEvent('task_created', payload)
}

export function publishTaskAssigned(payload) {
  publishEvent('task_assigned', payload)
}
