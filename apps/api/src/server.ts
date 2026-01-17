import express, { Express } from 'express'
import { testRouter } from '@routers/router'
import client from '@services/pg'

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", testRouter);

app.get('/', async (req, res) => {
  const queryResult = await client.query('SELECT NOW()')
  res.json(queryResult)
})

app.get("/sigma", (req, res) => {
  res.status(200).json({ "ok": "sigma"})
})

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001');
});
