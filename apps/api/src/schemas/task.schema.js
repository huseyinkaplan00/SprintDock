export const taskCreateSchema = {
  type: 'object',
  properties: {
    projectId: { type: 'string', minLength: 10 },
    title: { type: 'string', minLength: 2, maxLength: 200 },
    description: { type: 'string', maxLength: 4000 },
    tags: {
      type: 'array',
      items: { type: 'string', minLength: 1, maxLength: 32 },
      maxItems: 10,
    },
    status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
    assignee: { type: ['string', 'null'] },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    dueDate: { type: 'string' },
  },
  required: ['projectId', 'title'],
  additionalProperties: false,
}

export const taskUpdateSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 2, maxLength: 200 },
    description: { type: 'string', maxLength: 4000 },
    tags: {
      type: 'array',
      items: { type: 'string', minLength: 1, maxLength: 32 },
      maxItems: 10,
    },
    status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
    assignee: { type: ['string', 'null'] },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    dueDate: { type: 'string' },
  },
  required: [],
  additionalProperties: false,
}

export const taskBulkDeleteSchema = {
  type: 'object',
  properties: {
    taskIds: {
      type: 'array',
      items: { type: 'string', minLength: 10 },
      minItems: 1,
      maxItems: 100,
    },
  },
  required: ['taskIds'],
  additionalProperties: false,
}

export const commentCreateSchema = {
  type: 'object',
  properties: {
    taskId: { type: 'string', minLength: 10 },
    content: { type: 'string', minLength: 1, maxLength: 2000 },
  },
  required: ['taskId', 'content'],
  additionalProperties: false,
}
