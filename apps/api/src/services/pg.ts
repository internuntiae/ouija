import pg from 'pg'
const { Client } = pg

const client = new Client()

export const clientPromise = (async () => {
  await client.connect()
  return client
})()

export default client