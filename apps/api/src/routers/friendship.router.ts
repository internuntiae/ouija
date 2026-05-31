import { Router } from 'express'
import * as friendshipController from '@controllers/friendship.controller'
import { requireAuth } from '@middleware/auth.middleware'
import {
  validateBody,
  sendFriendRequestSchema,
  updateFriendshipSchema
} from '@middleware/validation.middleware'

const friendshipRouter = Router()

friendshipRouter.get('/users/:userId/friends', requireAuth, friendshipController.getFriendships)
friendshipRouter.post('/users/:userId/friends', requireAuth, validateBody(sendFriendRequestSchema), friendshipController.sendFriendRequest)
friendshipRouter.put('/users/:userId/friends/:friendId', requireAuth, validateBody(updateFriendshipSchema), friendshipController.updateFriendshipStatus)
friendshipRouter.delete('/users/:userId/friends/:friendId', requireAuth, friendshipController.deleteFriendship)

export { friendshipRouter }
