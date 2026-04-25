import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { Server } from 'http'

// Map of userId -> set of open sockets (one user can have multiple tabs/devices)
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

export interface WsEvent {
  type: WsEventType
  payload: Record<string, unknown>
}

/**
 * Attach a WebSocket server to an existing HTTP server.
 *
 * Clients connect with:
 *   ws://host/ws?userId=<userId>
 *
 * The server keeps the connection alive with ping/pong every 30 s.
 */
export function attachWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    const userId = url.searchParams.get('userId')

    if (!userId) {
      socket.close(1008, 'userId query parameter is required')
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

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping()
      }
    }, 30_000)

    socket.on('pong', () => {
      // Connection is still alive — nothing to do
    })

    socket.on('close', () => {
      clearInterval(pingInterval)
      userSockets.get(userId)?.delete(socket)
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId)
      }
      console.log(`[WS] User ${userId} disconnected`)
    })

    socket.on('error', (err) => {
      console.error(`[WS] Socket error for user ${userId}:`, err.message)
    })

    // Acknowledge successful connection
    socket.send(JSON.stringify({ type: 'connected', userId }))
  })

  wss.on('error', (err) => {
    console.error('[WS] Server error:', err.message)
  })

  console.log('[WS] WebSocket server attached at /ws')
  return wss
}

/**
 * Send an event to a specific user (all their connected sockets).
 */
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

/**
 * Send an event to multiple users at once.
 */
export function sendToUsers(userIds: string[], event: WsEvent): void {
  for (const userId of userIds) {
    sendToUser(userId, event)
  }
}

/**
 * Broadcast an event to every connected client (e.g. server-wide announcements).
 */
export function broadcast(event: WsEvent, wss: WebSocketServer): void {
  const payload = JSON.stringify(event)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}
