import express, { Express } from 'express';

const app: Express = express();

app.get('/', (req, res) => {
  res.status(200).json({ "ok": "okey"})
})

app.listen(3001, () => {
  console.log('App is running on http://localhost:3001');
});
