import { describe, expect, test } from '@jest/globals'
import { resolveSocketEvent } from '../consumers/notifier.consumer.js'
import { getAnalyticsSnapshot, handleAnalyticsEvent } from '../consumers/analytics.consumer.js'

describe('worker consumer helpers', () => {
  test('rabbit routing keylerini socket eventlerine esler', () => {
    expect(resolveSocketEvent('task_created')).toBe('task.updated')
    expect(resolveSocketEvent('task_assigned')).toBe('task.updated')
    expect(resolveSocketEvent('comment_added')).toBe('comment.added')
    expect(resolveSocketEvent('unknown')).toBeNull()
  })

  test('tracks analytics counters', async () => {
    await handleAnalyticsEvent({ routingKey: 'task_created' })
    const snapshot = getAnalyticsSnapshot()
    expect(snapshot.task_created).toBeGreaterThanOrEqual(1)
  })
})
