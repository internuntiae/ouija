import express, { Express } from 'express'
import {
  healthRouter,
  userRouter,
  msgRouter,
  friendshipRouter,
  chatRouter,
  reactionRouter
} from '@/routers'

const app: Express = express()

app.use(express.json())

app.use('/api', healthRouter)
app.use('/api', userRouter)
app.use('/api', msgRouter)
app.use('/api', friendshipRouter)
app.use('/api', chatRouter)
app.use('/api', reactionRouter)

app.get('/',(req,res)=>{
  res.status(201).json({"STATUS": "OK"})
});

app.listen(3001, () => {
  console.log('ouija-api is now running on http://localhost:3001')
})
