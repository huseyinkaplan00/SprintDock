import dotenv from 'dotenv'
import http from 'node:http'
import { env } from './config/env.js'
import { connectRabbit } from './config/rabbit.js'
import { connectMongo } from './config/mongo.js'
import { startConsuming } from './consumers/main.consumer.js'

dotenv.config()

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function connectWithRetry(url) {
  let attempt = 0
  while (true) {
    attempt += 1
    try {
      await connectRabbit(url)
      return
    } catch (err) {
      console.error(`[worker] rabbit baglantisi basarisiz (attempt ${attempt}):`, err.message)
      await wait(Math.min(5000, 500 * attempt))
    }
  }
}

async function withRetry(fn, label) {
  let attempt = 0
  while (true) {
    attempt += 1
    try {
      await fn()
      return
    } catch (err) {
      console.error(`[worker] ${label} baglantisi basarisiz (attempt ${attempt}):`, err.message)
      await wait(Math.min(5000, 500 * attempt))
    }
  }
}

async function main() {
  if (!env.rabbitUrl) throw new Error('RABBIT_URL eksik')
  // Mongo is optional for the worker (analytics). Don't block boot on it.
  void withRetry(connectMongo, 'mongo')
  await connectWithRetry(env.rabbitUrl)
  startConsuming()

  // Some hosting providers (e.g. Render free tier) require an HTTP listener.
  // Keep it tiny and isolated so local/docker runs don't depend on it.
  const port = Number(process.env.PORT || 0)
  if (port) {
    const server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: true, service: 'worker' }))
        return
      }
      res.writeHead(404)
      res.end()
    })
    server.listen(port, () => console.log(`[worker] health listening on ${port}`))
  }
}

main().catch((err) => {
  console.error('[worker] fatal', err)
  process.exit(1)
})
