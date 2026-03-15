import { describe, expect, test } from 'vitest'
import { normalizeRealtimePayload } from '../lib/realtime.js'

describe('normalizeRealtimePayload', () => {
  test('uses payload.taskId when present', () => {
    const result = normalizeRealtimePayload({ projectId: 'p1', taskId: 't1', id: 'x1' })
    expect(result.projectId).toBe('p1')
    expect(result.taskId).toBe('t1')
  })

  test('falls back to payload.id when taskId is missing', () => {
    const result = normalizeRealtimePayload({ projectId: 'p1', id: 'x1' })
    expect(result.projectId).toBe('p1')
    expect(result.taskId).toBe('x1')
  })
})
