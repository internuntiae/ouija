import { Request, Response } from 'express'
import * as msgService from '../services/message.service'

export const getAllMessages = async (req: Request, res: Response) => {
  const messages = await msgService.getAllMessages()
  res.status(200).json(messages)
}

export const createMessage = async (req: Request, res: Response) => {
  const { chatId, userId, content, attachments, reactions } = req.body
  const message = await msgService.createMessage(
    chatId,
    userId,
    content,
    attachments,
    reactions
  )
  res.status(201).json(message)
}

export const updateMessage = async (req: Request, res: Response) => {
  const { messageId, chatId, content, attachments, reactions } = req.body
  const message = await msgService.updateMessage(
    messageId,
    chatId,
    content,
    attachments,
    reactions
  )
  res.status(200).json(message)
}

export const deleteMessage = async (req: Request, res: Response) => {
  const { messageId, chatId } = req.body
  const message = await msgService.deleteMessage(messageId, chatId)
  res.status(200).json(message)
}
