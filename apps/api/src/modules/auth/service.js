import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { env } from '../../config/env.js'
import { httpError } from '../../utils/errors.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js'
import {
  findUserByEmail,
  createUser,
  findUserById,
  upsertOtp,
  findOtpByEmail,
  incrementOtpAttempts,
  deleteOtp,
  createSession,
  findSessionByRefreshTokenId,
  updateSessionRefreshToken,
  listSessionsByUserId,
  revokeSessionById,
  revokeOtherSessions as revokeOtherSessionsRepo,
} from './repository.js'
import { publishOtpRequested } from './events.js'

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

export async function requestOtp({ email }) {
  const normalizedEmail = normalizeEmail(email)
  const otp = crypto.randomInt(100000, 999999).toString()
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + env.otpTtlMinutes * 60 * 1000)
  const expiresInSec = env.otpTtlMinutes * 60

  await upsertOtp({ email: normalizedEmail, otpHash, expiresAt })

  publishOtpRequested({ email: normalizedEmail, otp })

  if (env.nodeEnv !== 'production' || env.otpEcho) {
    return { ok: true, otp, expiresInSec }
  }
  return { ok: true, expiresInSec }
}

export async function verifyOtp({ email, otp, ip, userAgent }) {
  const normalizedEmail = normalizeEmail(email)
  const record = await findOtpByEmail(normalizedEmail)
  if (!record) throw httpError(404, 'OTP not found')

  if (record.expiresAt < new Date()) {
    await deleteOtp(normalizedEmail)
    throw httpError(401, 'OTP expired')
  }

  if (record.attempts >= env.otpMaxAttempts) {
    throw httpError(429, 'Too many attempts')
  }

  const ok = await bcrypt.compare(String(otp), record.otpHash)
  if (!ok) {
    await incrementOtpAttempts(normalizedEmail)
    throw httpError(401, 'Invalid OTP')
  }

  let user = await findUserByEmail(normalizedEmail)
  if (!user) {
    user = await createUser({ email: normalizedEmail })
  }

  const refreshTokenId = crypto.randomUUID()
  const session = await createSession({
    userId: user._id,
    refreshTokenId,
    device: userAgent,
    ip,
  })

  const accessToken = signAccessToken({
    userId: user._id,
    role: user.role,
    sessionId: session._id,
  })

  const refreshToken = signRefreshToken({
    userId: user._id,
    refreshTokenId,
    sessionId: session._id,
  })

  await deleteOtp(normalizedEmail)

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, role: user.role },
  }
}

export async function refreshToken({ refreshToken }) {
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch (_err) {
    throw httpError(401, 'Invalid refresh token')
  }

  const userId = payload.sub
  const refreshTokenId = payload.jti
  const sessionId = payload.sid

  const session = await findSessionByRefreshTokenId(userId, refreshTokenId)
  if (!session) throw httpError(401, 'Session not found')

  const newRefreshTokenId = crypto.randomUUID()
  await updateSessionRefreshToken(sessionId, newRefreshTokenId)

  const user = await findUserById(userId)
  const accessToken = signAccessToken({
    userId,
    role: user?.role || 'member',
    sessionId,
  })

  const newRefreshToken = signRefreshToken({
    userId,
    refreshTokenId: newRefreshTokenId,
    sessionId,
  })

  return { accessToken, refreshToken: newRefreshToken }
}

export async function listSessions({ userId }) {
  const sessions = await listSessionsByUserId(userId)
  return sessions.map((s) => ({
    id: s._id,
    device: s.device || 'Unknown device',
    ip: s.ip || 'Unknown',
    lastUsed: s.lastUsed,
    createdAt: s.createdAt,
  }))
}

export async function revokeSession({ userId, sessionId }) {
  await revokeSessionById(userId, sessionId)
  return { ok: true }
}

export async function revokeOtherSessions({ userId, keepSessionId }) {
  await revokeOtherSessionsRepo(userId, keepSessionId)
  return { ok: true }
}
