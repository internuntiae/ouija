import { prisma } from '@lib/prisma'
import { Attachment, Reaction } from '@prisma/client'

export const getAllMessages = async () => {
  return prisma.message.findMany({
    take: 15
  })
}

export const createMessage = async (
  chatId: string,
  userId: string,
  content: string,
  attachments: Attachment[],
  reactions: Reaction[]
) => {
  return prisma.message.create({
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
}

export const updateMessage = async (
  messageId: string,
  chatId: string,
  content: string,
  attachments: Attachment[],
  reactions: Reaction[]
) => {
  return prisma.message.update({
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
}

export const deleteMessage = async (messageId: string, chatId: string) => {
  return prisma.message.delete({
    where: {
      id: messageId,
      chatId: chatId
    }
  })
}
