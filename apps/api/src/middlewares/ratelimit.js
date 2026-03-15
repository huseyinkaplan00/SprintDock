import { ensureRedisConnected } from '../config/redis.js'

const memory = new Map()

function memoryIncr(key, windowSec) {
  const now = Date.now()
  const current = memory.get(key)
  if (!current || current.expiresAt <= now) {
    memory.set(key, { count: 1, expiresAt: now + windowSec * 1000 })
    return 1
  }
  current.count += 1
  return current.count
}

function memoryTtlSec(key) {
  const now = Date.now()
  const current = memory.get(key)
  if (!current || current.expiresAt <= now) return 0
  return Math.max(1, Math.ceil((current.expiresAt - now) / 1000))
}

export function rateLimit({ keyPrefix, windowSec, max, keyGenerator }) {
  return async (req, res, next) => {
    const key = `${keyPrefix}:${keyGenerator(req)}`
    let redis = null

    try {
      redis = await ensureRedisConnected()

      if (redis) {
        const current = await redis.incr(key)
        if (current === 1) {
          await redis.expire(key, windowSec)
        }
        if (current > max) {
          const retryAfterSec = await redis.ttl(key)
          const waitSec = retryAfterSec > 0 ? retryAfterSec : windowSec
          res.setHeader('Retry-After', String(waitSec))
          return res.status(429).json({
            ok: false,
            error: 'Too many requests',
            retryAfterSec: waitSec,
          })
        }
      } else {
        const current = memoryIncr(key, windowSec)
        if (current > max) {
          const waitSec = memoryTtlSec(key) || windowSec
          res.setHeader('Retry-After', String(waitSec))
          return res.status(429).json({
            ok: false,
            error: 'Too many requests',
            retryAfterSec: waitSec,
          })
        }
      }
    } catch (err) {
      // If the rate-limit storage layer fails, allow the request and only log the error.
      console.warn('[api] rateLimit error:', err.message)
    }

    return next()
  }
}
