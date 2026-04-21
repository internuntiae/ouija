import 'dotenv/config'
console.log('CHECKING DB URL:', process.env.DATABASE_URL) // Does this print your postgres string?
console.log('CHECKING reset-pass:', process.env.AUTH_ENABLE_PASSWORD_RESET) // Does this print your postgres string?
console.log('CHECKING email-ver:', process.env.AUTH_REQUIRE_EMAIL_VERIFICATION) // Does this print your postgres string?
import { app } from '@/app'

app.listen(3001, () => {
  console.log('app is running on http://localhost:3001')
})
