const PROJECT_ICON_OPTIONS = [
  'rocket_launch',
  'design_services',
  'code',
  'campaign',
  'monitoring',
  'inventory_2',
  'bolt',
  'analytics',
]

export const projectCreateSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 2, maxLength: 120 },
    description: { type: 'string', maxLength: 2000 },
    icon: { type: 'string', enum: PROJECT_ICON_OPTIONS },
    tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
    members: { type: 'array', items: { type: 'string' }, maxItems: 50 },
  },
  required: ['title'],
  additionalProperties: false,
}

export const projectUpdateSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 2, maxLength: 120 },
    description: { type: 'string', maxLength: 2000 },
    icon: { type: 'string', enum: PROJECT_ICON_OPTIONS },
    status: { type: 'string', enum: ['active', 'archived'] },
    tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
    members: { type: 'array', items: { type: 'string' }, maxItems: 50 },
  },
  required: [],
  additionalProperties: false,
}
