import request from 'supertest'
import { TEST_TOKEN } from './setup'
import { app } from '@/app'
import { prisma } from '@/lib'
import { mockReaction1, mockReaction2, mockPrivateChat } from './fixtures'
import { ReactionType, PrismaClient } from '@prisma/client'
import { Mocked } from 'jest-mock'

const db = prisma as Mocked<PrismaClient>

// Reaction routes are mounted at /api/chats/:chatId/messages/:messageId/reactions.
// requireChatMember checks chatUser.findUnique — mock it to return a membership.
const CHAT_ID = mockPrivateChat.id      // 'chat_private_001'
const MESSAGE_ID = mockReaction1.messageId  // 'msg_001'
const SESSION_USER = 'user_alice_001'   // set by Redis mock in setup.ts

const mockMembership = { chatId: CHAT_ID, userId: SESSION_USER, role: 'MEMBER', joinedAt: new Date() }

function reactionsUrl(messageId = MESSAGE_ID) {
  return `/api/chats/${CHAT_ID}/messages/${messageId}/reactions`
}

beforeEach(() => {
  jest.clearAllMocks()
  // Allow requireChatMember to pass by default
  db.chatUser.findUnique.mockResolvedValue(mockMembership as any)
})

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/chats/:chatId/messages/:messageId/reactions', () => {
  it('returns all reactions for a message', async () => {
    db.reaction.findMany.mockResolvedValueOnce([mockReaction1, mockReaction2] as any)

    const res = await request(app)
        .get(reactionsUrl())
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].type).toBe('LIKE')
    expect(res.body[1].type).toBe('LOVE')
  })
})

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/chats/:chatId/messages/:messageId/reactions', () => {
  it('adds a reaction to a message', async () => {
    db.reaction.findUnique.mockResolvedValueOnce(null) // no existing reaction
    db.reaction.create.mockResolvedValueOnce(mockReaction1 as any)
    // addReaction then calls prisma.user.findUnique for WS payload — return null is fine
    db.user.findUnique.mockResolvedValueOnce(null)
    // getChatIdForMessage calls prisma.message.findUnique
    db.message.findUnique.mockResolvedValueOnce(null)

    const res = await request(app)
        .post(reactionsUrl())
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ type: 'LIKE' })

    expect(res.status).toBe(201)
    expect(res.body.type).toBe('LIKE')
  })

  it('returns 400 if reaction already exists', async () => {
    // 'Reaction already exists — use PUT to change it' is not a CLIENT_SAFE_MESSAGES
    // entry, so safeErrorMessage returns 'an unexpected error occurred' → 400
    db.reaction.findUnique.mockResolvedValueOnce(mockReaction1 as any)

    const res = await request(app)
        .post(reactionsUrl())
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ type: 'LIKE' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })
})

// ── PUT ───────────────────────────────────────────────────────────────────────

describe('PUT /api/chats/:chatId/messages/:messageId/reactions', () => {
  it('changes a reaction type', async () => {
    db.reaction.findUnique.mockResolvedValueOnce(mockReaction1 as any)
    db.reaction.update.mockResolvedValueOnce({ ...mockReaction1, type: ReactionType.LAUGH } as any)
    db.user.findUnique.mockResolvedValueOnce(null)
    db.message.findUnique.mockResolvedValueOnce(null)

    const res = await request(app)
        .put(reactionsUrl())
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ type: 'LAUGH' })

    expect(res.status).toBe(200)
    expect(res.body.type).toBe('LAUGH')
  })

  it('returns 400 if reaction does not exist', async () => {
    // 'Reaction not found' is not in CLIENT_SAFE_MESSAGES → 'an unexpected error occurred' → 400
    db.reaction.findUnique.mockResolvedValueOnce(null)

    const res = await request(app)
        .put(reactionsUrl())
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ type: 'LAUGH' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })
})

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/chats/:chatId/messages/:messageId/reactions', () => {
  it('removes a reaction and returns 204', async () => {
    db.reaction.findUnique.mockResolvedValueOnce(mockReaction1 as any)
    db.reaction.delete.mockResolvedValueOnce(mockReaction1 as any)
    db.message.findUnique.mockResolvedValueOnce(null)

    const res = await request(app)
        .delete(reactionsUrl())
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(204)
  })

  it('returns 400 if reaction does not exist', async () => {
    db.reaction.findUnique.mockResolvedValueOnce(null)

    const res = await request(app)
        .delete(reactionsUrl())
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })
})