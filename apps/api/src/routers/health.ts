import express from 'express'
import { prisma, redis } from '@/services'

const health = express.Router()

async function main() {
  await prisma.$connect()
  await redis.ping()
}

health.get('/health', async (req, res) => {
  main()
    .then(async () => {
      res.status(200)
      await prisma.$disconnect()
    })
    .catch((err) => {
      console.log((err as Error).message)
      res.status(500)
    })
})

export { health }
