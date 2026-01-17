import pg from 'pg'
const { Client } = pg

const postgresClient = new Client()

postgresClient
  .connect()
  .then(() => console.log('pg connected'))
  .catch((err) => console.error('pg conn err:', err))

export default postgresClient
