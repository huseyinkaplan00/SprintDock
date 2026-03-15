import mongoose from 'mongoose'

const counters = new Map()
const analyticsEventSchema = new mongoose.Schema(
  {
    routingKey: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
)
const AnalyticsEvent =
  mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema)

export async function handleAnalyticsEvent({ routingKey, payload }) {
  const current = counters.get(routingKey) || 0
  const next = current + 1
  counters.set(routingKey, next)

  if (mongoose.connection.readyState === 1) {
    try {
      await AnalyticsEvent.create({ routingKey, payload: payload || {} })
    } catch (err) {
      console.warn('[worker] analytics mongo yazim hatasi:', err.message)
    }
  }

  if (next % 25 === 0) {
    console.log(`[worker] analytics: ${routingKey} total=${next}`)
  }
}

export function getAnalyticsSnapshot() {
  return Object.fromEntries(counters.entries())
}
