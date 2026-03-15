import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import routes from './routes.js'
import { corsOptions } from './config/cors.js'
import { publishEvent } from './events/publisher.js'
import { emitToProject } from './sockets/index.js'
import { errorHandler } from './middlewares/error.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(cors(corsOptions))
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (req, res) => res.json({ ok: true, service: 'api' }))
  app.use('/api', routes)

  app.post('/debug/task', (req, res) => {
    const payload = {
      id: crypto.randomUUID?.() || String(Date.now()),
      title: req.body?.title || 'Sample Task',
      projectId: req.body?.projectId || 'demo-project',
      at: new Date().toISOString(),
    }

    try {
      publishEvent('task_created', payload)
      res.json({ ok: true, published: 'task_created', payload })
    } catch (_err) {
      res.status(503).json({ ok: false, error: 'Rabbit is not ready' })
    }
  })

  app.post('/internal/realtime', (req, res) => {
    const requiredKey = process.env.INTERNAL_API_KEY
    if (requiredKey && req.get('x-internal-key') !== requiredKey) {
      return res.status(403).json({ ok: false })
    }

    const { projectId, event, payload } = req.body || {}
    if (!projectId || !event) {
      return res.status(400).json({ ok: false, error: 'projectId and event are required' })
    }

    try {
      emitToProject(projectId, event, payload || {})
      return res.json({ ok: true })
    } catch (_err) {
      return res.status(500).json({ ok: false })
    }
  })

  app.use(errorHandler)

  return app
}
