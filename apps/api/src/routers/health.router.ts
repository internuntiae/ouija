import { Router, Request, Response } from 'express'
import { redis, prisma } from '@/lib'

const healthRouter = Router()

healthRouter.get('/health', async (req: Request, res: Response) => {
  // Check each service independently so one failure doesn't hide the other
  const [postgresStatus, redisStatus] = await Promise.all([
    prisma.$queryRaw`SELECT 1`
      .then(() => ({ status: 'connected' as const, error: null }))
      .catch((err: Error) => ({
        status: 'disconnected' as const,
        error: err.message
      })),

    redis
      .ping()
      .then(() => ({ status: 'connected' as const, error: null }))
      .catch((err: Error) => ({
        status: 'disconnected' as const,
        error: err.message
      }))
  ])

  const healthy =
    postgresStatus.status === 'connected' && redisStatus.status === 'connected'

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    databases: {
      postgres: postgresStatus,
      redis: redisStatus
    }
  })
})

export { healthRouter }
