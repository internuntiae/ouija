import { createClient } from 'redis'

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  password: process.env.REDIS_PASSWORD
})

redis.on('error', () => console.log('Redis Client Error'))

await redis.connect()

export { redis }
