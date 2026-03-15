import bcrypt from 'bcryptjs'

export async function hashValue(value) {
  return bcrypt.hash(String(value), 10)
}

export async function compareHash(value, hash) {
  return bcrypt.compare(String(value), String(hash))
}
