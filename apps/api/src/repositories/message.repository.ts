import { prisma } from '@lib/prisma'
import * as redis from '@repositories/message.repository.redis'
import { Attachment, Reaction } from '@prisma/client'

export const findMessage = async (chatId: string, messageId: number) => {
  // Change findUnique to findFirst
  const target = await prisma.message.findFirst({
    where: {
      id: messageId,
      chatId: chatId
    }
  })

  if (!target) {
    return null
  }

  return target
}

export const getAllMessages = async (
  chatId: string,
  limit: number,
  last: number
) => {
  const messages = await prisma.message.findMany({
    where: {
      chatId, // Assuming you need to filter by the chatId provided
      id: last > 0 ? { lt: last } : undefined
    },
    take: limit,
    orderBy: {
      id: 'desc'
    }
  })

  // Only sync to redis if there are actually messages to upload
  if (messages.length > 0) {
    await redis.uploadMessages(chatId, messages)
  }

  return messages
}
export const createMessage = async (
  chatId: string,
  userId: string,
  content: string,
  attachments: Attachment[],
  reactions: Reaction[]
) => {
  const message = await prisma.message.create({
    data: {
      chatId: chatId,
      senderId: userId,
      content: content,
      attachments: attachments.length
        ? {
            createMany: {
              data: attachments
            }
          }
        : undefined,
      reactions: reactions.length
        ? {
            createMany: {
              data: reactions
            }
          }
        : undefined
    }
  })
  await redis.uploadMessages(chatId, message)
}

export const updateMessage = async (
  messageId: number,
  chatId: string,
  content: string,
  attachments: Attachment[],
  reactions: Reaction[]
) => {
  const message = await prisma.message.update({
    where: {
      id: messageId,
      chatId: chatId
    },
    data: {
      content: content,
      attachments: {
        createMany: {
          data: attachments
        }
      },
      reactions: {
        createMany: {
          data: reactions
        }
      }
    }
  })

  await redis.updateMessage(chatId, messageId, message)
}

export const deleteMessage = async (messageId: number, chatId: string) => {
  await prisma.message.delete({
    where: {
      id: messageId,
      chatId: chatId
    }
  })

  await redis.deleteMessage(chatId, messageId)
}
