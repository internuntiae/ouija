import express, { Express } from 'express'
import { testRouter } from '@routers/router';
const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", testRouter);

app.get('/', (req, res) => {
  res.status(200).json({ "ok": "okey"})
})

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001');
});
