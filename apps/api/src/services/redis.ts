import { createClient } from 'redis'

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  password: process.env.REDIS_PASSWORD
})

redis.on('error', (err) => console.error('Redis Client Error', err))
redis.on('connect', () => console.log('Redis connected'))

redis.connect()

export { redis }
