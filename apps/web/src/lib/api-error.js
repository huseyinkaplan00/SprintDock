export async function parseApiError(response, fallbackMessage) {
  const defaultMessage = fallbackMessage || `Istek basarisiz (${response.status})`
  const contentType = response.headers.get('content-type') || ''
  const retryAfterHeader = Number(response.headers.get('retry-after') || 0)
  const result = {
    status: response.status,
    retryAfterSec: retryAfterHeader > 0 ? retryAfterHeader : 0,
    message: defaultMessage,
  }

  try {
    if (contentType.includes('application/json')) {
      const payload = await response.json()
      if (payload && typeof payload.error === 'string' && payload.error.trim()) {
        const payloadRetryAfter = Number(payload.retryAfterSec || 0)
        if (payloadRetryAfter > 0) {
          result.retryAfterSec = payloadRetryAfter
        }
        result.message = payload.error
        if (result.retryAfterSec > 0) {
          result.message = `${payload.error}. ${result.retryAfterSec} sn sonra tekrar deneyin.`
        }
        return result
      }
      if (payload && typeof payload.message === 'string' && payload.message.trim()) {
        result.message = payload.message
        return result
      }
    } else {
      const text = await response.text()
      if (text && text.trim()) {
        result.message = text
        return result
      }
    }
  } catch (_error) {
    // Ignore parse errors and fall back to generic message.
  }

  return result
}

export async function parseResponseError(response, fallbackMessage) {
  const parsed = await parseApiError(response, fallbackMessage)
  return parsed.message
}

export function getErrorMessage(error, fallbackMessage) {
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error.message === 'string' && error.message.trim()) return error.message
  return fallbackMessage || 'Beklenmeyen bir hata olustu.'
}
