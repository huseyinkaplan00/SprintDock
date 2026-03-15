import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { rateLimit } from '../../middlewares/ratelimit.js'
import { requireAuth } from '../../middlewares/auth.js'
import { env } from '../../config/env.js'
import {
  requestOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  revokeSessionSchema,
} from './validators.js'
import {
  requestOtpController,
  verifyOtpController,
  refreshTokenController,
  listSessionsController,
  revokeSessionController,
  revokeOtherSessionsController,
} from './controller.js'

export const authRouter = Router()

authRouter.post(
  '/request-otp',
  rateLimit({
    keyPrefix: 'otp',
    windowSec: env.otpRateLimitWindowSec,
    max: env.otpRateLimitMax,
    keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
  }),
  validate(requestOtpSchema),
  requestOtpController
)

authRouter.post('/verify-otp', validate(verifyOtpSchema), verifyOtpController)

authRouter.post('/refresh', validate(refreshTokenSchema), refreshTokenController)

export const sessionsRouter = Router()

sessionsRouter.use(requireAuth)

sessionsRouter.get('/', listSessionsController)

sessionsRouter.post('/revoke', validate(revokeSessionSchema), revokeSessionController)

sessionsRouter.post('/revoke-others', revokeOtherSessionsController)
