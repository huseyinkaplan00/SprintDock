import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import {
  taskCreateSchema,
  taskUpdateSchema,
  taskBulkDeleteSchema,
} from '../../schemas/task.schema.js'
import {
  createTaskController,
  listTasksController,
  getTaskController,
  updateTaskController,
  deleteTaskController,
  bulkDeleteTasksController,
} from './controller.js'

export const tasksRouter = Router()

tasksRouter.use(requireAuth)

tasksRouter.get('/', listTasksController)
tasksRouter.post('/', validate(taskCreateSchema), createTaskController)
tasksRouter.post('/bulk-delete', validate(taskBulkDeleteSchema), bulkDeleteTasksController)
tasksRouter.get('/:id', getTaskController)
tasksRouter.patch('/:id', validate(taskUpdateSchema), updateTaskController)
tasksRouter.delete('/:id', deleteTaskController)
