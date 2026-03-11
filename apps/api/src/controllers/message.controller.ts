import { Request, Response } from 'express'
import * as msgService from '@services/message.service'

export const getAllMessages = (req: Request, res: Response) => {
  const { chatId, limit, lastId } = req.body
  const messages = msgService.getAllMessages(chatId, limit, lastId)
  res.status(200).json(messages)
}

export const createMessage = (req: Request, res: Response) => {
  const { chatId, userId, content, attachments, reactions } = req.body
  const message = msgService.createMessage(
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
  const message = msgService.updateMessage(
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
  const message = msgService.deleteMessage(messageId, chatId)
  res.status(200).json(message)
}
