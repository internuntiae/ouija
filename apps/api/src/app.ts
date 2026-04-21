import express, { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger'
import {
  healthRouter,
  userRouter,
  msgRouter,
  friendshipRouter,
  chatRouter,
  reactionRouter,
  mediaRouter
} from '@/routers'

const app: Express = express()

app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api', healthRouter)
app.use('/api', userRouter)
app.use('/api', msgRouter)
app.use('/api', friendshipRouter)
app.use('/api', chatRouter)
app.use('/api', reactionRouter)
app.use('/api/media', mediaRouter)

app.use(function (req, res) {
  res.status(404)
  if (req.accepts('json')) {
    res.json({
      error: 'not found',
      version: '1.0.0'
    })
    return
  }

  res.type('txt').send(`Cannot ${req.method} ${req.path}`)
})

export { app }
