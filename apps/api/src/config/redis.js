import Redis from 'ioredis'
import { env } from './env.js'

let client = null
let connectPromise = null

export function getRedis() {
  if (!env.redisUrl) return null
  if (!client) {
    client = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    })
    client.on('error', (err) => {
      console.warn('[api] redis error:', err.message)
    })
  }
  return client
}

export async function ensureRedisConnected() {
  const redis = getRedis()
  if (!redis) return null

  if (redis.status === 'ready') {
    return redis
  }

  if (!connectPromise) {
    connectPromise = redis.connect().catch((err) => {
      connectPromise = null
      throw err
    })
  }

  await connectPromise
  return redis
}
