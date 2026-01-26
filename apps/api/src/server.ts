import express, { Express } from 'express'
import { healthRouter } from '@/routers'

const app: Express = express()

app.use('/api', healthRouter)

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001')
})
