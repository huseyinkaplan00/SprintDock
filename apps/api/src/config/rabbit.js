import amqp from 'amqplib'
import { env } from './env.js'

let conn
let channel

export const EXCHANGE = 'sprintdock.events'

export async function connectRabbit() {
  if (!env.rabbitUrl) throw new Error('RABBIT_URL eksik')

  conn = await amqp.connect(env.rabbitUrl)
  channel = await conn.createChannel()

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })

  console.log('[api] rabbit connected')
  return { conn, channel }
}

export function getChannel() {
  if (!channel) throw new Error('Rabbit kanali hazir degil')
  return channel
}
