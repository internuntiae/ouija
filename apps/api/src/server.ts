import express, { Express } from 'express'
import testRouter from '@routers/router'
import postgresClient from '@services/pg'
import redisClient from '@services/redis'
import health from '@services/db'

const app: Express = express()

app.use('/', testRouter)

app.use('/api', health)

app.get('/', async (req, res) => {
  const query = await postgresClient.query('SELECT * FROM test_table')
  const name = await redisClient.get('user:1:name')
  console.log(query.rows[0])
  console.log(name)
  res.json({
    pg: query.rows[0],
    user: name
  })
})

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001')
})
