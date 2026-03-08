import { Request, Response } from 'express'
import * as userService from '@services/user.service'

export const getUsers = async (req: Request, res: Response) => {
  const users = await userService.getAllUsers()
  res.status(200).json(users)
}

export const getUser = async (req: Request, res: Response) => {
  const { email } = req.body
  const user = await userService.getUser(email)
  res.status(200).json(user)
}

export const createUser = async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body

  const user = await userService.createUser(email, password, nickname)

  res.status(201).json(user)
}
