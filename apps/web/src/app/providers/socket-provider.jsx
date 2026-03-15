import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { createSocket } from '../../lib/socket.js'
import { useAuthStore } from '../../store/auth.store.js'

export const SocketContext = createContext(null)

export default function SocketProvider({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [socket, setSocket] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setSocket(null)
      return
    }

    const next = createSocket(accessToken)
    socketRef.current = next
    setSocket(next)

    return () => {
      next.disconnect()
      if (socketRef.current === next) {
        socketRef.current = null
      }
    }
  }, [accessToken])

  const value = useMemo(() => socket, [socket])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
