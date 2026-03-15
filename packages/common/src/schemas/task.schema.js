export const sharedTaskSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    projectId: { type: 'string' },
    title: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    status: { type: 'string' },
    assignee: { type: ['string', 'null'] },
  },
  required: ['id', 'projectId', 'title', 'status'],
}
