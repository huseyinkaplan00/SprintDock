let realtimeNsp = null

export function setRealtimeNamespace(nsp) {
  realtimeNsp = nsp
}

export function emitToProjectct(projectId, event, payload) {
  if (!realtimeNsp) throw new Error('Realtime namespace is not initialized')
  realtimeNsp.to(`project:${projectId}`).emit(event, payload)
}

export { emitToProjectct as emitToProject }
