import request from 'supertest'
import { TEST_TOKEN } from './setup'
import { app } from '@/app'
import { prisma } from '@/lib'
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockPrivateChat,
  mockGroupChat
} from './fixtures'
import { ChatRole, PrismaClient } from '@prisma/client'
import { Mocked } from 'jest-mock'

const db = prisma as Mocked<PrismaClient>

// Session user is user_alice_001.
// Routes using requireChatMember/requireChatAdmin check chatUser.findUnique.
// Routes using requireSelf check :userId === session user.

const SESSION_USER = 'user_alice_001'
const aliceMemberPrivate = { chatId: mockPrivateChat.id, userId: SESSION_USER, role: ChatRole.ADMIN,  joinedAt: new Date() }
const aliceMemberGroup   = { chatId: mockGroupChat.id,   userId: SESSION_USER, role: ChatRole.ADMIN,  joinedAt: new Date() }

beforeEach(() => jest.clearAllMocks())

// ── GET /api/chats/:chatId ────────────────────────────────────────────────────

describe('GET /api/chats/:chatId', () => {
  it('returns a chat by id', async () => {
    db.chatUser.findUnique.mockResolvedValueOnce(aliceMemberPrivate as any) // requireChatMember
    db.chat.findUnique.mockResolvedValueOnce(mockPrivateChat as any)

    const res = await request(app)
        .get('/api/chats/chat_private_001')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('chat_private_001')
    expect(res.body.type).toBe('PRIVATE')
  })

  it('returns 404 if chat not found', async () => {
    // 'Chat not found' includes 'not found' → errorStatus returns 404
    db.chatUser.findUnique.mockResolvedValueOnce(aliceMemberPrivate as any)
    db.chat.findUnique.mockResolvedValueOnce(null)

    const res = await request(app)
        .get('/api/chats/nonexistent')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/not found/)
  })
})

// ── GET /api/users/:userId/chats ──────────────────────────────────────────────

describe('GET /api/users/:userId/chats', () => {
  it('returns all chats for a user', async () => {
    db.user.findUnique.mockResolvedValueOnce(mockUser1 as any)
    db.chat.findMany.mockResolvedValueOnce([mockPrivateChat, mockGroupChat] as any)

    const res = await request(app)
        .get('/api/users/user_alice_001/chats')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })
})

// ── POST /api/chats ───────────────────────────────────────────────────────────

describe('POST /api/chats', () => {
  it('creates a private chat between two users', async () => {
    db.user.findUnique
        .mockResolvedValueOnce(mockUser1 as any)
        .mockResolvedValueOnce(mockUser2 as any)
    // Private chats go through prisma.$transaction — mock it to return the chat
    ;(db.$transaction as jest.Mock).mockImplementationOnce(
        (fn: (tx: unknown) => unknown) => fn({
          chat: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockPrivateChat)
          }
        })
    )

    const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ type: 'PRIVATE', userIds: ['user_alice_001', 'user_bob_002'] })

    expect(res.status).toBe(201)
    expect(res.body.type).toBe('PRIVATE')
    expect(res.body.users).toHaveLength(2)
  })

  it('creates a group chat with a name', async () => {
    db.user.findUnique
        .mockResolvedValueOnce(mockUser1 as any)
        .mockResolvedValueOnce(mockUser2 as any)
        .mockResolvedValueOnce(mockUser3 as any)
    db.chat.create.mockResolvedValueOnce(mockGroupChat as any)

    const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'Ouija Dev Team',
          type: 'GROUP',
          userIds: ['user_alice_001', 'user_bob_002', 'user_carol_003']
        })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Ouija Dev Team')
    expect(res.body.users).toHaveLength(3)
  })

  it('returns 400 if group chat has no name', async () => {
    // 'Group chats require a name' → errorStatus returns 400
    const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ type: 'GROUP', userIds: ['user_alice_001', 'user_bob_002'] })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/name/)
  })

  it('returns 400 if fewer than 2 users provided', async () => {
    // Zod min(2) on userIds fires first → 400
    const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ type: 'PRIVATE', userIds: ['user_alice_001'] })

    expect(res.status).toBe(400)
  })
})

// ── PUT /api/chats/:chatId ────────────────────────────────────────────────────

describe('PUT /api/chats/:chatId', () => {
  it('updates a group chat name', async () => {
    db.chatUser.findUnique.mockResolvedValueOnce(aliceMemberGroup as any)  // requireChatAdmin
    db.chat.findUnique.mockResolvedValueOnce(mockGroupChat as any)
    db.chat.update.mockResolvedValueOnce({ ...mockGroupChat, name: 'New Name' } as any)

    const res = await request(app)
        .put('/api/chats/chat_group_002')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'New Name' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('New Name')
  })
})

// ── DELETE /api/chats/:chatId ─────────────────────────────────────────────────

describe('DELETE /api/chats/:chatId', () => {
  it('deletes a chat and returns 204', async () => {
    db.chatUser.findUnique.mockResolvedValueOnce(aliceMemberGroup as any)  // requireChatAdmin
    db.chat.findUnique.mockResolvedValueOnce(mockGroupChat as any)
    db.chat.delete.mockResolvedValueOnce(mockGroupChat as any)

    const res = await request(app)
        .delete('/api/chats/chat_group_002')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(204)
  })
})

// ── POST /api/chats/:chatId/members ──────────────────────────────────────────

describe('POST /api/chats/:chatId/members', () => {
  it('adds a new member to a chat', async () => {
    const newMember = { chatId: mockGroupChat.id, userId: mockUser3.id, role: ChatRole.MEMBER, joinedAt: new Date() }
    db.chatUser.findUnique.mockResolvedValueOnce(aliceMemberGroup as any) // requireChatAdmin
    db.chat.findUnique.mockResolvedValueOnce(mockGroupChat as any)
    db.user.findUnique.mockResolvedValueOnce(mockUser3 as any)
    db.chatUser.findUnique.mockResolvedValueOnce(null)           // not yet a member
    db.chatUser.create.mockResolvedValueOnce(newMember as any)

    const res = await request(app)
        .post('/api/chats/chat_group_002/members')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ userId: 'user_carol_003' })

    expect(res.status).toBe(201)
    expect(res.body.role).toBe('MEMBER')
  })

  it('returns 409 if user is already a member', async () => {
    // 'User already in chat' → errorStatus returns 409
    db.chatUser.findUnique.mockResolvedValueOnce(aliceMemberGroup as any) // requireChatAdmin
    db.chat.findUnique.mockResolvedValueOnce(mockGroupChat as any)
    db.user.findUnique.mockResolvedValueOnce(mockUser2 as any)
    db.chatUser.findUnique.mockResolvedValueOnce({ chatId: mockGroupChat.id, userId: mockUser2.id, role: ChatRole.MEMBER, joinedAt: new Date() } as any)

    const res = await request(app)
        .post('/api/chats/chat_group_002/members')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ userId: 'user_bob_002' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already in chat/)
  })
})

// ── PUT /api/chats/:chatId/members/:userId ────────────────────────────────────

describe('PUT /api/chats/:chatId/members/:userId', () => {
  it('promotes a member to admin', async () => {
    db.chatUser.findUnique
        .mockResolvedValueOnce(aliceMemberGroup as any)  // requireChatAdmin
        .mockResolvedValueOnce({ chatId: mockGroupChat.id, userId: mockUser2.id, role: ChatRole.MEMBER, joinedAt: new Date() } as any)
    db.chatUser.update.mockResolvedValueOnce({ chatId: mockGroupChat.id, userId: mockUser2.id, role: ChatRole.ADMIN, joinedAt: new Date() } as any)

    const res = await request(app)
        .put('/api/chats/chat_group_002/members/user_bob_002')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ role: 'ADMIN' })

    expect(res.status).toBe(200)
    expect(res.body.role).toBe('ADMIN')
  })
})

// ── DELETE /api/chats/:chatId/members/:userId ─────────────────────────────────

describe('DELETE /api/chats/:chatId/members/:userId', () => {
  it('removes a member from a chat and returns 204', async () => {
    db.chatUser.findUnique
        .mockResolvedValueOnce(aliceMemberGroup as any)  // requireChatMember
        .mockResolvedValueOnce({ chatId: mockGroupChat.id, userId: mockUser2.id, role: ChatRole.MEMBER, joinedAt: new Date() } as any)
    db.chatUser.delete.mockResolvedValueOnce({ chatId: mockGroupChat.id, userId: mockUser2.id, role: ChatRole.MEMBER, joinedAt: new Date() } as any)

    const res = await request(app)
        .delete('/api/chats/chat_group_002/members/user_bob_002')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(204)
  })
})