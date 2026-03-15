import { env } from './env.js'

const allowedOrigins = env.corsOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function isOriginAllowed(origin) {
  if (!origin) return true
  if (allowedOrigins.includes('*')) return true
  if (origin === 'https://sprintdock-app.vercel.app') return true
  // Keep preview support for Vercel branch deployments.
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true
  if (
    env.nodeEnv !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  ) {
    return true
  }
  return allowedOrigins.includes(origin)
}

export const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true)
    return callback(null, false)
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-key'],
  credentials: true,
}

export const socketCorsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true)
    return callback(null, false)
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}
