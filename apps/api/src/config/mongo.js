import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectMongo() {
  if (!env.mongoUri) throw new Error('MONGO_URI eksik')
  await mongoose.connect(env.mongoUri)
  console.log('[api] mongo connected')
}
