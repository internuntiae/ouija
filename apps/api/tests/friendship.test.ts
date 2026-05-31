import request from 'supertest'
import { TEST_TOKEN } from './setup'
import { app } from '@/app'
import { prisma } from '@/lib'
import {
  mockUser1,
  mockUser2,
  mockFriendshipPending,
  mockFriendshipAccepted
} from './fixtures'
import { FriendStatus, PrismaClient } from '@prisma/client'
import { Mocked } from 'jest-mock'

const db = prisma as Mocked<PrismaClient>

// Session user is user_alice_001 (set by the Redis mock in setup.ts).
// requireSelf enforces :userId === session user, so all routes use user_alice_001.
//
// NOTE: friendship.repository uses prisma.friendship.findFirst (not findUnique)
// for getFriendship — chain findFirst mocks for update/delete tests.

beforeEach(() => jest.clearAllMocks())

describe('GET /api/users/:userId/friends', () => {
  it('returns all friendships for a user', async () => {
    db.user.findUnique.mockResolvedValueOnce(mockUser1 as any)
    db.friendship.findMany.mockResolvedValueOnce([
      mockFriendshipPending,
      mockFriendshipAccepted
    ] as any)

    const res = await request(app)
        .get('/api/users/user_alice_001/friends')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('filters by status=PENDING', async () => {
    db.user.findUnique.mockResolvedValueOnce(mockUser1 as any)
    db.friendship.findMany.mockResolvedValueOnce([mockFriendshipPending] as any)

    const res = await request(app)
        .get('/api/users/user_alice_001/friends?status=PENDING')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body[0].status).toBe('PENDING')
  })

  it('returns 404 if user does not exist', async () => {
    db.user.findUnique.mockResolvedValueOnce(null)

    const res = await request(app)
        .get('/api/users/user_alice_001/friends')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/not found/i)
  })
})

describe('POST /api/users/:userId/friends', () => {
  it('sends a friend request', async () => {
    db.user.findUnique
        .mockResolvedValueOnce(mockUser1 as any)  // getUserById(userId)
        .mockResolvedValueOnce(mockUser2 as any)  // getUserById(friendId)
    db.friendship.findFirst.mockResolvedValueOnce(null)   // getFriendship → not exists
    db.friendship.create.mockResolvedValueOnce(mockFriendshipPending as any)

    const res = await request(app)
        .post('/api/users/user_alice_001/friends')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ friendId: 'user_bob_002' })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe('PENDING')
  })

  it('returns 409 if friendship already exists', async () => {
    db.user.findUnique
        .mockResolvedValueOnce(mockUser1 as any)
        .mockResolvedValueOnce(mockUser2 as any)
    db.friendship.findFirst.mockResolvedValueOnce(mockFriendshipPending as any) // already exists

    const res = await request(app)
        .post('/api/users/user_alice_001/friends')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ friendId: 'user_bob_002' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already exists/)
  })

  it('returns 400 if user tries to friend themselves', async () => {
    const res = await request(app)
        .post('/api/users/user_alice_001/friends')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ friendId: 'user_alice_001' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/yourself/)
  })
})

describe('PUT /api/users/:userId/friends/:friendId', () => {
  it('accepts a friend request', async () => {
    // Alice must be the recipient (friendId) to accept.
    // repo.getFriendship (findFirst) is called twice: once by the service check,
    // once internally by repo.updateFriendshipStatus before the DB update.
    const aliceIsRecipient = { ...mockFriendshipPending, userId: 'user_bob_002', friendId: 'user_alice_001' }
    db.friendship.findFirst
        .mockResolvedValueOnce(aliceIsRecipient as any)   // service existence check
        .mockResolvedValueOnce(aliceIsRecipient as any)   // repo.updateFriendshipStatus internal lookup
    db.friendship.update.mockResolvedValueOnce({ ...aliceIsRecipient, status: FriendStatus.ACCEPTED } as any)

    const res = await request(app)
        .put('/api/users/user_alice_001/friends/user_bob_002')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ status: 'ACCEPTED' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ACCEPTED')
  })

  it('blocks a user', async () => {
    // BLOCKED can be set by either party — no recipient check
    db.friendship.findFirst
        .mockResolvedValueOnce(mockFriendshipAccepted as any)
        .mockResolvedValueOnce(mockFriendshipAccepted as any)
    db.friendship.update.mockResolvedValueOnce({ ...mockFriendshipAccepted, status: FriendStatus.BLOCKED } as any)

    const res = await request(app)
        .put('/api/users/user_alice_001/friends/user_carol_003')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ status: 'BLOCKED' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('BLOCKED')
  })
})

describe('DELETE /api/users/:userId/friends/:friendId', () => {
  it('removes a friendship and returns 204', async () => {
    // repo.deleteFriendship calls getFriendship (findFirst) internally before delete
    db.friendship.findFirst.mockResolvedValueOnce(mockFriendshipAccepted as any)
    db.friendship.delete.mockResolvedValueOnce(mockFriendshipAccepted as any)

    const res = await request(app)
        .delete('/api/users/user_alice_001/friends/user_carol_003')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(204)
  })

  it('returns 404 if friendship does not exist', async () => {
    db.friendship.findFirst.mockResolvedValueOnce(null)

    const res = await request(app)
        .delete('/api/users/user_alice_001/friends/user_bob_002')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/not found/)
  })
})