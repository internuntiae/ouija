import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { prisma, tokenService } from '@/lib'
import { UserStatus } from '@prisma/client'

const userSockets = new Map<string, Set<WebSocket>>()

export type WsEventType =
  | 'message:created'
  | 'message:updated'
  | 'message:deleted'
  | 'reaction:added'
  | 'reaction:updated'
  | 'reaction:deleted'
  | 'friendship:requested'
  | 'friendship:updated'
  | 'friendship:deleted'
  | 'chat:created'
  | 'chat:updated'
  | 'chat:deleted'
  | 'typing:start'
  | 'typing:stop'
  | 'user:status'

export interface WsEvent {
  type: WsEventType
  payload: Record<string, unknown>
}

/**
 * Attach a WebSocket server to an existing HTTP server.
 *
 * Authentication flow (token never in URL):
 *   1. Client opens ws://host/ws  (no token in query string)
 *   2. Server sends { type: "auth:required" }
 *   3. Client replies with { type: "auth", token: "<sessionToken>" }
 *   4. Server validates and either accepts or closes with 4401
 *
 * The server keeps the connection alive with ping/pong every 30 s.
 */
export function attachWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', async (socket: WebSocket) => {
    // Prompt the client to authenticate
    socket.send(JSON.stringify({ type: 'auth:required' }))

    // Give the client 10 s to send credentials before closing
    const authTimeout = setTimeout(() => {
      socket.close(4401, 'authentication timeout')
    }, 10_000)

    // Wait for the first message which must be the auth frame
    socket.once('message', async (data) => {
      clearTimeout(authTimeout)

      let token: string | undefined
      try {
        const frame = JSON.parse(data.toString()) as { type: string; token?: string }
        if (frame.type === 'auth') token = frame.token
      } catch {
        socket.close(4400, 'malformed auth frame')
        return
      }

      if (!token) {
        socket.close(4401, 'token is required')
        return
      }

      const userId = await tokenService.validateSessionToken(token)
      if (!userId) {
        socket.close(4401, 'invalid or expired session token')
        return
      }

      // Register socket
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set())
      }
      userSockets.get(userId)!.add(socket)

      console.log(
        `[WS] User ${userId} connected (${userSockets.get(userId)!.size} sockets)`
      )

      // Restore previous status on reconnect
      const savedStatus = userPreviousStatus.get(userId)
      if (savedStatus) {
        prisma.user
          .update({
            where: { id: userId },
            data: { status: savedStatus as UserStatus }
          })
          .then(() => {
            userPreviousStatus.delete(userId)
            broadcastStatusToFriends(userId, savedStatus)
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({
                  type: 'user:status',
                  payload: { userId, status: savedStatus, self: true }
                })
              )
            }
          })
          .catch(() => { /* ignore */ })
      }

      // Keep-alive ping
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.ping()
        }
      }, 30_000)

      socket.on('pong', () => { /* still alive */ })

      socket.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as {
            type: string
            payload: Record<string, unknown>
          }

          if (msg.type === 'typing:start' || msg.type === 'typing:stop') {
            const { chatId, nickname, avatarUrl } = msg.payload as {
              chatId: string
              nickname: string
              avatarUrl?: string | null
            }
            if (!chatId) return
            prisma.chatUser
              .findMany({ where: { chatId }, select: { userId: true } })
              .then((members: { userId: string }[]) => {
                const otherIds = members
                  .map((m) => m.userId)
                  .filter((id: string) => id !== userId)
                sendToUsers(otherIds, {
                  type: msg.type as WsEventType,
                  payload: { chatId, userId, nickname, avatarUrl }
                })
              })
              .catch(() => { /* ignore */ })
          }

          if (msg.type === 'user:status') {
            const { status } = msg.payload as { status: string }
            // Client-settable statuses — INVISIBLE is server-managed only
            const clientStatuses: UserStatus[] = [UserStatus.ONLINE, UserStatus.OFFLINE, UserStatus.AWAY, UserStatus.BUSY]
            if (!clientStatuses.includes(status as UserStatus)) return
            userPreviousStatus.delete(userId)
            broadcastStatusToFriends(userId, status)
          }
        } catch {
          /* ignore malformed messages */
        }
      })

      socket.on('close', () => {
        clearInterval(pingInterval)
        userSockets.get(userId)?.delete(socket)
        if (userSockets.get(userId)?.size === 0) {
          userSockets.delete(userId)
          prisma.user
            .findUnique({ where: { id: userId }, select: { status: true } })
            .then((user: { status: UserStatus } | null) => {
              if (!user) return
              const currentStatus = user.status
              if (currentStatus === UserStatus.OFFLINE) {
                broadcastStatusToFriends(userId, UserStatus.OFFLINE)
                return
              }
              if (currentStatus !== UserStatus.INVISIBLE) {
                userPreviousStatus.set(userId, currentStatus)
              }
              return prisma.user
                .update({
                  where: { id: userId },
                  data: { status: UserStatus.INVISIBLE }
                })
                .then(() => {
                  broadcastStatusToFriends(userId, UserStatus.INVISIBLE)
                })
            })
            .catch(() => { /* ignore */ })
        }
        console.log(`[WS] User ${userId} disconnected`)
      })

      socket.on('error', (err) => {
        console.error(`[WS] Socket error for user ${userId}:`, err.message)
      })

      socket.send(JSON.stringify({ type: 'connected', userId }))
    })
  })

  wss.on('error', (err) => {
    console.error('[WS] Server error:', err.message)
  })

  console.log('[WS] WebSocket server attached at /ws')
  return wss
}

export function sendToUser(userId: string, event: WsEvent): void {
  const sockets = userSockets.get(userId)
  if (!sockets) return
  const payload = JSON.stringify(event)
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload)
    }
  }
}

export function sendToUsers(userIds: string[], event: WsEvent): void {
  for (const userId of userIds) {
    sendToUser(userId, event)
  }
}

export function broadcast(event: WsEvent, wss: WebSocketServer): void {
  const payload = JSON.stringify(event)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}

const userPreviousStatus = new Map<string, string>()

/**
 * Broadcast a status change to all users who share at least one chat with userId.
 * Uses a single query with a subquery instead of two sequential round-trips.
 */
async function broadcastStatusToFriends(
  userId: string,
  status: string
): Promise<void> {
  try {
    const coMembers = await prisma.chatUser.findMany({
      where: {
        userId: { not: userId },
        chat: {
          users: { some: { userId } }
        }
      },
      select: { userId: true },
      distinct: ['userId']
    })

    const friendIds = coMembers.map((cu: { userId: string }) => cu.userId)

    sendToUsers(friendIds, {
      type: 'user:status',
      payload: { userId, status }
    })
  } catch {
    /* ignore */
  }
}
