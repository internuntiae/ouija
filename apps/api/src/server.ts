import express, { Express } from 'express'
import testRouter from '@routers/router'
import health from '@services/db'

const app: Express = express()

app.use('/', testRouter)

app.use('/api', health)

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001')
})
