import { Router } from 'express'
import * as chatController from '@controllers/chat.controller'

const chatRouter = Router()

// GET  /api/chats/:chatId            - get a single chat by id
chatRouter.get('/chats/:chatId', chatController.getChatById)

// GET  /api/users/:userId/chats      - list all chats for a user
chatRouter.get('/users/:userId/chats', chatController.getChatsByUserId)

// POST /api/chats                    - create a new chat   body: { name?, type, userIds[] }
chatRouter.post('/chats', chatController.createChat)

// PUT  /api/chats/:chatId            - update chat name/type   body: { name?, type? }
chatRouter.put('/chats/:chatId', chatController.updateChat)

// DELETE /api/chats/:chatId          - delete a chat
chatRouter.delete('/chats/:chatId', chatController.deleteChat)

// --- ChatUser sub-resource ---

// POST   /api/chats/:chatId/members           - add a user to chat   body: { userId, role? }
chatRouter.post('/chats/:chatId/members', chatController.addUserToChat)

// PUT    /api/chats/:chatId/members/:userId    - change a member's role   body: { role }
chatRouter.put('/chats/:chatId/members/:userId', chatController.updateChatUserRole)

// DELETE /api/chats/:chatId/members/:userId    - remove a member from chat
chatRouter.delete('/chats/:chatId/members/:userId', chatController.removeUserFromChat)

export { chatRouter }
