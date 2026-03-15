import { Router } from 'express'
import { authRouter, sessionsRouter } from './modules/auth/routes.js'
import { projectsRouter } from './modules/projects/routes.js'
import { tasksRouter } from './modules/tasks/routes.js'
import { commentsRouter } from './modules/comments/routes.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'SprintDock API' })
})

router.use('/auth', authRouter)
router.use('/sessions', sessionsRouter)
router.use('/projects', projectsRouter)
router.use('/tasks', tasksRouter)
router.use('/comments', commentsRouter)

export default router
