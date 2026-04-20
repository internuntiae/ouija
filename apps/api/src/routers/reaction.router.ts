import { Router } from 'express'
import * as reactionController from '@controllers/reaction.controller'

const reactionRouter = Router()

// GET    /api/messages/:messageId/reactions              - list all reactions on a message
reactionRouter.get('/messages/:messageId/reactions', reactionController.getReactions)

// POST   /api/messages/:messageId/reactions              - add a reaction   body: { userId, type }
reactionRouter.post('/messages/:messageId/reactions', reactionController.addReaction)

// PUT    /api/messages/:messageId/reactions/:userId      - change reaction type   body: { type }
reactionRouter.put('/messages/:messageId/reactions/:userId', reactionController.updateReaction)

// DELETE /api/messages/:messageId/reactions/:userId      - remove a reaction
reactionRouter.delete('/messages/:messageId/reactions/:userId', reactionController.deleteReaction)

export { reactionRouter }
