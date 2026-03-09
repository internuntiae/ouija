import { Router, Request, Response } from 'express'
import { redis, prisma } from '@/lib'

const healthRouter = Router()

healthRouter.get('/health', async (req: Request, res: Response) => {
  try {
    // Check Prisma connection
    await prisma.$queryRaw`SELECT 1`

    // Check Redis connection
    await redis.ping()

    // Both connections successful
    res.status(200).json({
      status: 'healthy',
      databases: {
        postgres: 'connected',
        redis: 'connected'
      }
    })
  } catch (error) {
    // One or both connections failed
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { healthRouter }
