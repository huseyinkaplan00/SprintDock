import { publishEvent } from '../../events/publisher.js'

export function publishOtpRequested(payload) {
  publishEvent('otp_requested', payload)
}
