import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  user: 'dbuser',
  password: 'secretpassword',
  host: 'database.server.com',
  port: 3211,
  database: 'mydb',
})

console.log(await pool.query('SELECT NOW()'))