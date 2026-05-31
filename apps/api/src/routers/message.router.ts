import { Router } from 'express'
import * as msgController from '@controllers/message.controller'
import { requireAuth } from '@middleware/auth.middleware'
import { requireChatMember, requireMessageOwner } from '@middleware/chat.middleware'

const msgRouter = Router()

msgRouter.get(
  '/chats/:chatId/messages',
  requireAuth,
  requireChatMember,
  msgController.getAllMessages
)
msgRouter.post(
  '/chats/:chatId/messages',
  requireAuth,
  requireChatMember,
  msgController.createMessage
)
msgRouter.put(
  '/chats/:chatId/messages/:messageId',
  requireAuth,
  requireChatMember,
  requireMessageOwner,
  msgController.updateMessage
)
msgRouter.delete(
  '/chats/:chatId/messages/:messageId',
  requireAuth,
  requireChatMember,
  requireMessageOwner,
  msgController.deleteMessage
)

export { msgRouter }
