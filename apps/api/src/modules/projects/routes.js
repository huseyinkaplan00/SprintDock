import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { projectCreateSchema, projectUpdateSchema } from '../../schemas/project.schema.js'
import {
  createProjectController,
  listProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
} from './controller.js'

export const projectsRouter = Router()

projectsRouter.use(requireAuth)

projectsRouter.get('/', listProjectsController)
projectsRouter.post('/', validate(projectCreateSchema), createProjectController)
projectsRouter.get('/:id', getProjectController)
projectsRouter.patch('/:id', validate(projectUpdateSchema), updateProjectController)
projectsRouter.delete('/:id', deleteProjectController)
