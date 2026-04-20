import { Router } from 'express'
import * as msgController from '@controllers/message.controller'

const msgRouter = Router()

// GET    /api/chats/:chatId/messages              - fetch messages (paginated via ?limit=&lastId=)
msgRouter.get('/chats/:chatId/messages', msgController.getAllMessages)

// POST   /api/chats/:chatId/messages              - create a message   body: { userId, content, attachments?, reactions? }
msgRouter.post('/chats/:chatId/messages', msgController.createMessage)

// PUT    /api/chats/:chatId/messages/:messageId   - edit a message   body: { content?, attachments?, reactions? }
msgRouter.put('/chats/:chatId/messages/:messageId', msgController.updateMessage)

// DELETE /api/chats/:chatId/messages/:messageId   - delete a message
msgRouter.delete('/chats/:chatId/messages/:messageId', msgController.deleteMessage)

export { msgRouter }
