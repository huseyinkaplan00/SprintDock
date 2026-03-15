import { useContext } from 'react'
import { SocketContext } from '../app/providers/socket-provider.jsx'

export function useSocket() {
  return useContext(SocketContext)
}
