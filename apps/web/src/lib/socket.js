import { io } from 'socket.io-client'
import { env } from '../config/env.js'

export function createSocket(accessToken) {
  return io(`${env.socketUrl}/realtime`, {
    transports: ['polling', 'websocket'],
    auth: accessToken ? { token: accessToken } : undefined,
  })
}
