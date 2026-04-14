import { Router } from 'express'
import * as friendshipController from '@controllers/friendship.controller'

const friendshipRouter = Router()

// GET /api/users/:userId/friends            - list all friendships (optionally filter by ?status=PENDING|ACCEPTED|BLOCKED)
friendshipRouter.get('/users/:userId/friends', friendshipController.getFriendships)

// POST /api/users/:userId/friends           - send a friend request  body: { friendId }
friendshipRouter.post('/users/:userId/friends', friendshipController.sendFriendRequest)

// PUT /api/users/:userId/friends/:friendId  - accept / block a friendship  body: { status }
friendshipRouter.put('/users/:userId/friends/:friendId', friendshipController.updateFriendshipStatus)

// DELETE /api/users/:userId/friends/:friendId - remove a friendship
friendshipRouter.delete('/users/:userId/friends/:friendId', friendshipController.deleteFriendship)

export { friendshipRouter }
