import * as msgPostgreRepo from '@repositories/message.repository'
import * as msgRedisRepo from '@repositories/message.repository.redis'
import { Attachment, Reaction } from '@prisma/client'

export const getAllMessages = async (
  chatId: string,
  limit: number,
  lastId: number
) => {
  const isInRedis = await msgRedisRepo.findMessage(chatId, lastId)
  if (lastId == 0 || !isInRedis) {
    return msgPostgreRepo.getAllMessages(chatId, limit, lastId)
  }
  return msgRedisRepo.getAllMessages(chatId)
}

export const createMessage = async (
  chatId: string,
  userId: string,
  content: string,
  attachments: Attachment[],
  reactions: Reaction[]
) => {
  if (content == null) {
    throw new Error('Content is null')
  }

  await msgPostgreRepo.createMessage(
    chatId,
    userId,
    content,
    attachments,
    reactions
  )
}

export const updateMessage = async (
  messageId: number,
  chatId: string,
  content: string,
  attachments: Attachment[],
  reactions: Reaction[]
) => {
  const target = await msgPostgreRepo.findMessage(chatId, messageId)
  if (target == null) {
    throw new Error('Record does not exist')
  }

  return msgPostgreRepo.updateMessage(
    messageId,
    chatId,
    content,
    attachments,
    reactions
  )
}

export const deleteMessage = async (messageId: number, chatId: string) => {
  const target = await msgPostgreRepo.findMessage(chatId, messageId)
  if (target == null) {
    throw new Error('Record does not exist')
  }

  return msgPostgreRepo.deleteMessage(messageId, chatId)
}
