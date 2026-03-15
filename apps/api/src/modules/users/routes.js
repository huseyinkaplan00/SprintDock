import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { listUsersController } from './controller.js'

export const usersRouter = Router()

usersRouter.use(requireAuth)
usersRouter.get('/', listUsersController)
