import express, { Express } from 'express'
import { testRouter, health } from '@/routers'

const app: Express = express()

app.use('/api', testRouter, health)

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001')
})
