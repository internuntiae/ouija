import { Router } from 'express'
import * as chatController from '@controllers/chat.controller'
import { requireAuth } from '@middleware/auth.middleware'
import { requireChatMember, requireChatAdmin } from '@middleware/chat.middleware'
import {
  validateBody,
  createChatSchema,
  updateChatSchema,
  addChatMemberSchema,
  updateChatMemberRoleSchema
} from '@middleware/validation.middleware'

const chatRouter = Router()

chatRouter.get('/chats/:chatId', requireAuth, requireChatMember, chatController.getChatById)
chatRouter.get('/users/:userId/chats', requireAuth, chatController.getChatsByUserId)
chatRouter.post('/chats', requireAuth, validateBody(createChatSchema), chatController.createChat)
chatRouter.put('/chats/:chatId', requireAuth, requireChatAdmin, validateBody(updateChatSchema), chatController.updateChat)
chatRouter.delete('/chats/:chatId', requireAuth, requireChatAdmin, chatController.deleteChat)

chatRouter.post('/chats/:chatId/members', requireAuth, requireChatAdmin, validateBody(addChatMemberSchema), chatController.addUserToChat)
chatRouter.put('/chats/:chatId/members/:userId', requireAuth, requireChatAdmin, validateBody(updateChatMemberRoleSchema), chatController.updateChatUserRole)
chatRouter.delete('/chats/:chatId/members/:userId', requireAuth, requireChatMember, chatController.removeUserFromChat)

export { chatRouter }
