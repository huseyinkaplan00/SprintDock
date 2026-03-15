import { Server } from 'socket.io'
import { socketCorsOptions } from '../config/cors.js'
import { setRealtimeNamespace } from '../sockets/index.js'
import { verifyAccessToken } from '../utils/jwt.js'

export function attachSocket(server) {
  const io = new Server(server, {
    cors: socketCorsOptions,
  })

  const nsp = io.of('/realtime')
  setRealtimeNamespace(nsp)

  nsp.use((socket, next) => {
    const authToken = socket.handshake.auth?.token
    const header = socket.handshake.headers?.authorization
    const token = authToken || (header?.startsWith('Bearer ') ? header.slice(7) : header)

    if (!token) {
      return next(new Error('Yetkisiz'))
    }

    try {
      const payload = verifyAccessToken(token)
      socket.user = {
        id: payload.sub,
        role: payload.role,
        sessionId: payload.sid,
      }
      return next()
    } catch (_err) {
      return next(new Error('Yetkisiz'))
    }
  })

  nsp.on('connection', (socket) => {
    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`)
    })

    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`)
    })
  })

  console.log('[api] socket attached')
  return { io, nsp }
}
