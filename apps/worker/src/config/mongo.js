import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectMongo() {
  if (!env.mongoUri) {
    console.warn('[worker] MONGO_URI yok, analytics kalici yazilmayacak')
    return null
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  await mongoose.connect(env.mongoUri)
  console.log('[worker] mongo connected')
  return mongoose.connection
}
