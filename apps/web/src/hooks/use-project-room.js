import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { normalizeRealtimePayload } from '../lib/realtime.js'
import { useSocket } from './use-socket.js'

export function useProjectRoom({ projectId, taskId } = {}) {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const normalizedProjectId = projectId ? String(projectId) : ''
  const normalizedTaskId = taskId ? String(taskId) : ''

  useEffect(() => {
    if (!socket || !normalizedProjectId) return

    const joinRoom = () => {
      socket.emit('join_project', normalizedProjectId)
    }

    if (socket.connected) {
      joinRoom()
    }

    socket.on('connect', joinRoom)

    return () => {
      socket.off('connect', joinRoom)
      socket.emit('leave_project', normalizedProjectId)
    }
  }, [socket, normalizedProjectId])

  useEffect(() => {
    if (!socket || !normalizedProjectId) return

    const onTaskUpdated = (payload) => {
      const event = normalizeRealtimePayload(payload)
      if (!event.projectId || event.projectId !== normalizedProjectId) return

      queryClient.invalidateQueries({ queryKey: ['tasks', normalizedProjectId] })

      if (event.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', event.taskId] })
      }

      if (normalizedTaskId && event.taskId === normalizedTaskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', normalizedTaskId] })
      }
    }

    const onCommentAdded = (payload) => {
      const event = normalizeRealtimePayload(payload)
      if (!event.projectId || event.projectId !== normalizedProjectId) return

      queryClient.invalidateQueries({ queryKey: ['tasks', normalizedProjectId] })

      if (event.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', event.taskId] })
        queryClient.invalidateQueries({ queryKey: ['comments', event.taskId] })
      }
    }

    socket.on('task.updated', onTaskUpdated)
    socket.on('comment.added', onCommentAdded)

    return () => {
      socket.off('task.updated', onTaskUpdated)
      socket.off('comment.added', onCommentAdded)
    }
  }, [socket, queryClient, normalizedProjectId, normalizedTaskId])
}
