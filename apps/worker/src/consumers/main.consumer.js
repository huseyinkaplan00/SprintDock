import { getChannel, QUEUE } from '../config/rabbit.js'
import { handleOtpRequested } from './mailer.consumer.js'
import { handleRealtimeNotification } from './notifier.consumer.js'
import { handleAnalyticsEvent } from './analytics.consumer.js'

export function startConsuming() {
  const channel = getChannel()

  channel.consume(
    QUEUE,
    async (msg) => {
      if (!msg) return

      try {
        const key = msg.fields.routingKey
        const payload = JSON.parse(msg.content.toString())
        console.log('[worker] event:', key, payload)

        if (key === 'otp_requested') {
          await handleOtpRequested(payload)
        }

        await handleRealtimeNotification({ routingKey: key, payload })
        await handleAnalyticsEvent({ routingKey: key, payload })
      } catch (err) {
        console.error('[worker] tuketici hatasi:', err.message)
      } finally {
        channel.ack(msg)
      }
    },
    { noAck: false }
  )

  console.log('[worker] tuketim basladi:', QUEUE)
}
