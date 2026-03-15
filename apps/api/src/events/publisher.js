import { getChannel, EXCHANGE } from '../config/rabbit.js'

export function publishEvent(routingKey, payload) {
  const channel = getChannel()
  const body = Buffer.from(JSON.stringify(payload))
  channel.publish(EXCHANGE, routingKey, body, { persistent: true })
}
