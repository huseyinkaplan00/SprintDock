export const requestOtpSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
  },
  required: ['email'],
  additionalProperties: false,
}

export const verifyOtpSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    otp: { type: 'string', pattern: '^[0-9]{6}$' },
  },
  required: ['email', 'otp'],
  additionalProperties: false,
}

export const refreshTokenSchema = {
  type: 'object',
  properties: {
    refreshToken: { type: 'string', minLength: 10 },
  },
  required: ['refreshToken'],
  additionalProperties: false,
}

export const revokeSessionSchema = {
  type: 'object',
  properties: {
    sessionId: { type: 'string', minLength: 10 },
  },
  required: ['sessionId'],
  additionalProperties: false,
}
