import express, { Express } from 'express'
import { main } from '@lib/script'
import { prisma } from '@lib/prisma'

const app: Express = express()

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001')
})
