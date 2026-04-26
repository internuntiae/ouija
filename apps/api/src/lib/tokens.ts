import { randomBytes } from 'crypto'
import { redis } from '@/lib'

const VERIFY_TTL_SECONDS = 60 * 60 * 24 // 24 hours
const RESET_TTL_SECONDS = 60 * 60 // 1 hour

const verifyKey = (token: string) => `verify:${token}`
const resetKey = (token: string) => `pwreset:${token}`

// ── Email verification ────────────────────────────────────────────────────────

export const createVerificationToken = async (
  userId: string
): Promise<string> => {
  const token = randomBytes(32).toString('hex')
  await redis.set(verifyKey(token), userId, { EX: VERIFY_TTL_SECONDS })
  return token
}

export const consumeVerificationToken = async (
  token: string
): Promise<string | null> => {
  const key = verifyKey(token)
  const userId = await redis.get(key)
  if (userId) await redis.del(key) // one-time use
  return userId
}

// ── Password reset ────────────────────────────────────────────────────────────

export const createPasswordResetToken = async (
  userId: string
): Promise<string> => {
  const token = randomBytes(32).toString('hex')
  await redis.set(resetKey(token), userId, { EX: RESET_TTL_SECONDS })
  return token
}

export const consumePasswordResetToken = async (
  token: string
): Promise<string | null> => {
  const key = resetKey(token)
  const userId = await redis.get(key)
  if (userId) await redis.del(key) // one-time use
  return userId
}
