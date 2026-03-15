import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../app.js'

describe('auth surface', () => {
  test('GET /health returns 200', async () => {
    const res = await request(createApp()).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  test('GET /api/sessions requires authorization', async () => {
    const res = await request(createApp()).get('/api/sessions')
    expect(res.status).toBe(401)
    expect(res.body.ok).toBe(false)
  })
})
