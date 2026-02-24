import { Request, Response } from 'express'
import * as userService from '@services/user.service'

export const getUsers = async (req: Request, res: Response) => {
  const users = await userService.getAllUsers()
  res.status(200).json(users)
}

export const getUser = async (req: Request, res: Response) => {
  const user = await userService.getUser(req.params.id)
  res.status(200).json(user)
}

export const createUser = async (req: Request, res: Response) => {
  const { id } = req.body

  const user = await userService.createUser(id)

  res.status(201).json(user)
}
