import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { commentCreateSchema } from '../../schemas/task.schema.js'
import {
  createCommentController,
  listCommentsController,
  deleteCommentController,
} from './controller.js'

export const commentsRouter = Router()

commentsRouter.use(requireAuth)

commentsRouter.get('/', listCommentsController)
commentsRouter.post('/', validate(commentCreateSchema), createCommentController)
commentsRouter.delete('/:id', deleteCommentController)
