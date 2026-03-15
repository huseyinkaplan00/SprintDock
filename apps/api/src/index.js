import dotenv from 'dotenv'
import http from 'http'

import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectMongo } from './config/mongo.js'
import { connectRabbit } from './config/rabbit.js'
import { ensureRedisConnected } from './config/redis.js'
import { attachSocket } from './loaders/socket.js'

dotenv.config()

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function withRetry(fn, label) {
  let attempt = 0
  while (true) {
    try {
      await fn()
      return
    } catch (err) {
      attempt += 1
      console.error(`[api] ${label} failed (attempt ${attempt}):`, err.message)
      await wait(Math.min(5000, 500 * attempt))
    }
  }
}

async function main() {
  // Render (and most PaaS) requires binding to PORT quickly. Don't block boot on
  // external dependencies; instead connect in the background with retries.
  const app = createApp()
  const server = http.createServer(app)
  attachSocket(server)

  server.listen(env.port, () => console.log(`[api] listening on ${env.port}`))

  // Dependency init (background)
  void withRetry(connectMongo, 'mongo')
  void withRetry(connectRabbit, 'rabbit')
  void withRetry(async () => {
    await ensureRedisConnected()
  }, 'redis')
}

main().catch((err) => {
  console.error('[api] fatal', err)
  process.exit(1)
})
