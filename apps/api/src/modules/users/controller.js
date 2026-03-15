import { listUsersService } from './service.js'

export async function listUsersController(_req, res, next) {
  try {
    const users = await listUsersService()
    res.json({ users })
  } catch (error) {
    next(error)
  }
}
