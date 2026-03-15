import dotenv from 'dotenv'

dotenv.config()

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),

  mongoUri: process.env.MONGO_URI,
  rabbitUrl: process.env.RABBIT_URL,
  redisUrl: process.env.REDIS_URL,

  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  corsOrigins:
    process.env.CORS_ORIGINS ||
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,https://sprintdock-huseyinkaplan.vercel.app',

  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 3),
  otpRateLimitWindowSec: Number(process.env.OTP_RATE_LIMIT_WINDOW_SEC || 60),
  otpRateLimitMax: Number(process.env.OTP_RATE_LIMIT_MAX || 3),
  // Demo convenience: echo OTP in response even in production when explicitly enabled.
  otpEcho: process.env.OTP_ECHO === 'true',
}
