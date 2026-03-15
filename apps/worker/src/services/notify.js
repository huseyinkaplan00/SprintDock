import { env } from '../config/env.js'

export async function notifyRealtime({ projectId, event, payload }) {
  const url = env.apiInternalUrl
  if (!url) return

  const headers = {
    'content-type': 'application/json',
  }

  if (env.internalApiKey) {
    headers['x-internal-key'] = env.internalApiKey
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, event, payload }),
    })

    if (!res.ok) {
      console.warn('[worker] realtime bildirim basarisiz:', res.status)
    }
  } catch (err) {
    console.warn('[worker] realtime bildirim hatasi:', err.message)
  }
}
