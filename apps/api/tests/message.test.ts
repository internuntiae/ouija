import request from 'supertest'
import { app } from '../src/app'
import { prisma } from '../src/lib'
import { redis } from '../src/lib'
import {
  mockMessage1,
  mockMessage2,
  mockMessageWithAttachment
} from './fixtures'

import { PrismaClient } from '@prisma/client'
import { Mocked } from 'jest-mock'

const db = prisma as Mocked<PrismaClient>
const redisMock = redis as jest.Mocked<typeof redis>

beforeEach(() => jest.clearAllMocks())

describe('GET /api/chats/:chatId/messages', () => {
  it('returns messages from postgres when lastId=0', async () => {
    // 1. Mock a cache miss (empty list)
    redisMock.lRange.mockResolvedValueOnce([])

    // 2. Mock DB calls
    db.message.findUnique.mockResolvedValueOnce(null)
    db.message.findMany.mockResolvedValueOnce([mockMessage2, mockMessage1])

    // 3. Mock the cache update (caching the results from DB)
    redisMock.lPush.mockResolvedValueOnce(2)

    const res = await request(app).get(
      '/api/chats/chat_private_001/messages?limit=20&lastId=0'
    )

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].content).toBe('All good Alice, you?')
  })
})

describe('POST /api/chats/:chatId/messages', () => {
  it('creates a plain text message', async () => {
    db.message.create.mockResolvedValueOnce(mockMessage1)
    redisMock.set = jest.fn().mockResolvedValueOnce('OK')

    const res = await request(app)
      .post('/api/chats/chat_private_001/messages')
      .send({ userId: 'user_alice_001', content: 'Hey Bob, how are you?' })

    expect(res.status).toBe(201)
  })

  it('creates a message with an attachment', async () => {
    db.message.create.mockResolvedValueOnce(mockMessageWithAttachment)
    redisMock.set = jest.fn().mockResolvedValueOnce('OK')

    const res = await request(app)
      .post('/api/chats/chat_group_002/messages')
      .send({
        userId: 'user_alice_001',
        content: 'Check this out',
        attachments: [
          { url: 'https://cdn.ouija.dev/files/report.pdf', type: 'FILE' }
        ]
      })

    expect(res.status).toBe(201)
  })

  it('returns 500 if content is null', async () => {
    const res = await request(app)
      .post('/api/chats/chat_private_001/messages')
      .send({ userId: 'user_alice_001', content: null })

    expect(res.status).toBe(500)
    expect(res.body.error).toMatch(/null/i)
  })
})

describe('PUT /api/chats/:chatId/messages/:messageId', () => {
  it('edits message content', async () => {
    // 1. Mock DB
    db.message.findUnique.mockResolvedValueOnce(mockMessage1)
    db.message.update.mockResolvedValueOnce({
      ...mockMessage1,
      content: 'Edited content'
    })

    // 2. Mock Redis: find the message in the cached list so it can be updated
    redisMock.lRange.mockResolvedValueOnce([JSON.stringify(mockMessage1)])
    redisMock.lSet.mockResolvedValueOnce('OK')

    const res = await request(app)
      .put('/api/chats/chat_private_001/messages/1')
      .send({ content: 'Edited content' })

    expect(res.status).toBe(200)
    expect(res.body.content).toBe('Edited content')
  })

  it('returns 500 if message does not exist', async () => {
    // Force both DB and Cache to be empty to ensure a 500
    db.message.findUnique.mockResolvedValueOnce(null)
    redisMock.lRange.mockResolvedValueOnce([])

    const res = await request(app)
      .put('/api/chats/chat_private_001/messages/999')
      .send({ content: 'Ghost edit' })

    expect(res.status).toBe(500)
    expect(res.body.error).toMatch(/not found/i)
  })
})

describe('DELETE /api/chats/:chatId/messages/:messageId', () => {
  it('deletes a message and returns 204', async () => {
    db.message.findUnique.mockResolvedValueOnce(mockMessage1)
    db.message.delete.mockResolvedValueOnce(mockMessage1)

    // Ensure lRange returns the message so the controller can find it to remove it
    redisMock.lRange.mockResolvedValueOnce([JSON.stringify(mockMessage1)])
    redisMock.lRem.mockResolvedValueOnce(1)

    const res = await request(app).delete(
      '/api/chats/chat_private_001/messages/1'
    )

    expect(res.status).toBe(204)
  })

  it('returns 500 if message does not exist', async () => {
    db.message.findUnique.mockResolvedValueOnce(null)
    redisMock.lRange.mockResolvedValueOnce([]) // Empty cache

    const res = await request(app).delete(
      '/api/chats/chat_private_001/messages/999'
    )

    expect(res.status).toBe(500)
    expect(res.body.error).toMatch(/not found/i)
  })
})
