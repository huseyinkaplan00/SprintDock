import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signAccessToken({ userId, role, sessionId }) {
  return jwt.sign(
    { role, sid: sessionId },
    env.jwtSecret,
    { subject: String(userId), expiresIn: env.jwtAccessExpiry }
  )
}

export function signRefreshToken({ userId, refreshTokenId, sessionId }) {
  return jwt.sign(
    { sid: sessionId, jti: refreshTokenId },
    env.jwtRefreshSecret,
    { subject: String(userId), expiresIn: env.jwtRefreshExpiry }
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret)
}
