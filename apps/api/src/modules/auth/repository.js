import mongoose from 'mongoose'

const { Schema } = mongoose

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { timestamps: true }
)

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenId: { type: String, required: true, index: true },
    device: { type: String },
    ip: { type: String },
    lastUsed: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const User = mongoose.models.User || mongoose.model('User', userSchema)
const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema)
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema)

export async function findUserByEmail(email) {
  return User.findOne({ email })
}

export async function createUser({ email }) {
  return User.create({ email })
}

export async function upsertOtp({ email, otpHash, expiresAt }) {
  return Otp.findOneAndUpdate(
    { email },
    { otpHash, expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
}

export async function findOtpByEmail(email) {
  return Otp.findOne({ email })
}

export async function incrementOtpAttempts(email) {
  return Otp.findOneAndUpdate({ email }, { $inc: { attempts: 1 } }, { new: true })
}

export async function deleteOtp(email) {
  return Otp.deleteOne({ email })
}

export async function createSession({ userId, refreshTokenId, device, ip }) {
  return Session.create({ userId, refreshTokenId, device, ip })
}

export async function findSessionByRefreshTokenId(userId, refreshTokenId) {
  return Session.findOne({ userId, refreshTokenId })
}

export async function findSessionById(sessionId, userId) {
  return Session.findOne({ _id: sessionId, userId })
}

export async function updateSessionRefreshToken(sessionId, refreshTokenId) {
  return Session.findByIdAndUpdate(
    sessionId,
    { refreshTokenId, lastUsed: new Date() },
    { new: true }
  )
}

export async function listSessionsByUserId(userId) {
  return Session.find({ userId }).sort({ lastUsed: -1 })
}

export async function revokeSessionById(userId, sessionId) {
  return Session.deleteOne({ _id: sessionId, userId })
}

export async function revokeOtherSessions(userId, keepSessionId) {
  return Session.deleteMany({ userId, _id: { $ne: keepSessionId } })
}

export async function findUserById(userId) {
  return User.findById(userId)
}
