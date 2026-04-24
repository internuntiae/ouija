import { Request, Response } from 'express'
import * as reactionService from '@services/reaction.service'
import { ReactionType } from '@prisma/client'

export const getReactions = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params
    const reactions = await reactionService.getReactionsByMessage(messageId)
    res.status(200).json(reactions)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const addReaction = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params
    const { userId, type } = req.body
    const reaction = await reactionService.addReaction(
      messageId,
      userId,
      type as ReactionType
    )
    res.status(201).json(reaction)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const updateReaction = async (req: Request, res: Response) => {
  try {
    const { messageId, userId } = req.params
    const { type } = req.body
    const reaction = await reactionService.updateReaction(
      messageId,
      userId,
      type as ReactionType
    )
    res.status(200).json(reaction)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const deleteReaction = async (req: Request, res: Response) => {
  try {
    const { messageId, userId } = req.params
    await reactionService.deleteReaction(messageId, userId)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}
