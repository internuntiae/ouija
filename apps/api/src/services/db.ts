import { Router } from 'express'
import redisClient from './redis'
import postgresClient from './pg'

const health = Router()

health.get('/health', async (req, res) => {
  try {
    await redisClient.ping()
    await postgresClient.query('SELECT 1')

    res.sendStatus(200)
  } catch (e) {
    console.error('Health failed: ', (e as Error).message)
    res.sendStatus(503)
  }
})

export default health
