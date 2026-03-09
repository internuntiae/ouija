import * as msgRepo from '@repositories/message.repository'
import { Attachment, Reaction } from '@prisma/client'

export const getAllMessages = async () => {
  return msgRepo.getAllMessages()
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
  return msgRepo.createMessage(chatId, userId, content, attachments, reactions)
}

export const updateMessage = async (
  messageId: string,
  chatId: string,
  content: string,
  attachments: Attachment[],
  reactions: Reaction[]
) => {
  // Some checks
  return msgRepo.updateMessage(
    messageId,
    chatId,
    content,
    attachments,
    reactions
  )
}

export const deleteMessage = async (messageId: string, chatId: string) => {
  // Some checks
  return msgRepo.deleteMessage(messageId, chatId)
}
