import { verifyAccessToken } from '../utils/jwt.js'
import { findSessionById } from '../modules/auth/repository.js'

export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : header

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  try {
    const payload = verifyAccessToken(token)
    if (!payload?.sid || !payload?.sub) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    const session = await findSessionById(payload.sid, payload.sub)
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Invalid session' })
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      sessionId: payload.sid,
    }
    return next()
  } catch (_err) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
}
