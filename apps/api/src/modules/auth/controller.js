import { httpError } from '../../utils/errors.js'
import {
  requestOtp,
  verifyOtp,
  refreshToken as refreshService,
  listSessions,
  revokeSession,
  revokeOtherSessions,
} from './service.js'

export async function requestOtpController(req, res, next) {
  try {
    const result = await requestOtp({ email: req.body.email })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function verifyOtpController(req, res, next) {
  try {
    const result = await verifyOtp({
      email: req.body.email,
      otp: req.body.otp,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function refreshTokenController(req, res, next) {
  try {
    const result = await refreshService({ refreshToken: req.body.refreshToken })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function listSessionsController(req, res, next) {
  try {
    const result = await listSessions({ userId: req.user.id })
    res.json({ sessions: result })
  } catch (err) {
    next(err)
  }
}

export async function revokeSessionController(req, res, next) {
  try {
    const result = await revokeSession({
      userId: req.user.id,
      sessionId: req.body.sessionId,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function revokeOtherSessionsController(req, res, next) {
  try {
    const sessionId = req.user.sessionId
    if (!sessionId) throw httpError(400, 'Mevcut oturum bulunamadi')
    const result = await revokeOtherSessions({ userId: req.user.id, keepSessionId: sessionId })
    res.json(result)
  } catch (err) {
    next(err)
  }
}
