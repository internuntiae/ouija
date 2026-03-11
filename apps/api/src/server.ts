import express, { Express } from 'express'
import { healthRouter, userRouter, msgRouter } from '@/routers'

const app: Express = express()

app.use('/api', healthRouter)
app.use('/api', userRouter)
app.use('/api', msgRouter)

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001 and changes are applied')
})
