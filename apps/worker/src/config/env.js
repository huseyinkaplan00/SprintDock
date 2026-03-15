import dotenv from 'dotenv'

dotenv.config()

export const env = {
  rabbitUrl: process.env.RABBIT_URL || '',
  mongoUri: process.env.MONGO_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  apiInternalUrl: process.env.API_INTERNAL_URL || '',
  internalApiKey: process.env.INTERNAL_API_KEY || '',
}
