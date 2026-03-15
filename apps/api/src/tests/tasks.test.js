import { describe, expect, test } from '@jest/globals'
import { taskCreateSchema, taskUpdateSchema, taskBulkDeleteSchema } from '../schemas/task.schema.js'

describe('task schema', () => {
  test('allows assignee to be null on create', () => {
    expect(taskCreateSchema.properties.assignee.type).toContain('null')
  })

  test('allows assignee to be null on update', () => {
    expect(taskUpdateSchema.properties.assignee.type).toContain('null')
  })

  test('supports tags array for create/update payloads', () => {
    expect(taskCreateSchema.properties.tags.type).toBe('array')
    expect(taskUpdateSchema.properties.tags.type).toBe('array')
  })

  test('validates bulk delete payload shape', () => {
    expect(taskBulkDeleteSchema.required).toContain('taskIds')
    expect(taskBulkDeleteSchema.properties.taskIds.type).toBe('array')
  })
})
