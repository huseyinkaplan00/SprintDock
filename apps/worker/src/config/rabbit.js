import amqp from 'amqplib'

export const EXCHANGE = 'sprintdock.events'
export const QUEUE = 'sprintdock.worker'

let conn
let channel

export async function connectRabbit(url) {
  conn = await amqp.connect(url)
  channel = await conn.createChannel()

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })
  await channel.assertQueue(QUEUE, { durable: true })

  await channel.bindQueue(QUEUE, EXCHANGE, 'task_created')
  await channel.bindQueue(QUEUE, EXCHANGE, 'task_assigned')
  await channel.bindQueue(QUEUE, EXCHANGE, 'comment_added')
  await channel.bindQueue(QUEUE, EXCHANGE, 'otp_requested')

  console.log('[worker] rabbit connected')
  return { conn, channel }
}

export function getChannel() {
  if (!channel) throw new Error('Rabbit kanali hazir degil')
  return channel
}
