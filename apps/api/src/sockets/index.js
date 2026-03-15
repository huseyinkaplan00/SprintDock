let realtimeNsp = null

export function setRealtimeNamespace(nsp) {
  realtimeNsp = nsp
}

export function emitToProject(projectId, event, payload) {
  if (!realtimeNsp) throw new Error('Realtime namespace baslatilmadi')
  realtimeNsp.to(`project:${projectId}`).emit(event, payload)
}
