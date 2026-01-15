import express, { Express } from 'express'

import { client } from './db/redis'

async function main(){
  await client.connect()
}
const app: Express = express();

app.get('/', (req, res) => {
  res.status(200).json({ "ok": "okey"})
})

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001');
});
