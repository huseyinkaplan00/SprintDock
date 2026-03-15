export function errorHandler(err, req, res, _next) {
  const status = err.status || 500
  const message = err.message || 'Sunucu Hatasi'
  if (status >= 500) {
    console.error('[api] error:', err)
  }
  res.status(status).json({ ok: false, error: message })
}
