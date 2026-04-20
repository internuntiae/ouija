import { Request, Response } from 'express'
import * as chatService from '@services/chat.service'
import { ChatType, ChatRole } from '@prisma/client'

export const getChatById = async (req: Request, res: Response) => {
  try {
    const chat = await chatService.getChatById(req.params.chatId)
    res.status(200).json(chat)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const getChatsByUserId = async (req: Request, res: Response) => {
  try {
    const chats = await chatService.getChatsByUserId(req.params.userId)
    res.status(200).json(chats)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const createChat = async (req: Request, res: Response) => {
  try {
    const { name, type, userIds } = req.body
    const chat = await chatService.createChat(name, type as ChatType, userIds)
    res.status(201).json(chat)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const updateChat = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params
    const data: Partial<{ name: string; type: ChatType }> = req.body
    const chat = await chatService.updateChat(chatId, data)
    res.status(200).json(chat)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const deleteChat = async (req: Request, res: Response) => {
  try {
    await chatService.deleteChat(req.params.chatId)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// ChatUser

export const addUserToChat = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params
    const { userId, role } = req.body
    const chatUser = await chatService.addUserToChat(
      chatId,
      userId,
      role as ChatRole | undefined
    )
    res.status(201).json(chatUser)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const removeUserFromChat = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.params
    await chatService.removeUserFromChat(chatId, userId)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const updateChatUserRole = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.params
    const { role } = req.body
    const chatUser = await chatService.updateChatUserRole(
      chatId,
      userId,
      role as ChatRole
    )
    res.status(200).json(chatUser)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}
