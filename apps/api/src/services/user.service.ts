import * as userRepo from '@repositories/user.repository'
import { UserStatus } from '@prisma/client'

export const getUserById = async (id: string) => {
  if (!id) throw new Error('id is required')
  return userRepo.getUserById(id)
}

export const getUserByEmail = async (email: string) => {
  if (!email) throw new Error('email is required')
  return userRepo.getUserByEmail(email)
}

export const getUserByNickname = async (nickname: string) => {
  if (!nickname) throw new Error('nickname is required')
  return userRepo.getUserByNickname(nickname)
}

export const getUsers = async () => {
  return userRepo.getUsers()
}

export const createUser = async (data: {
  email: string
  password: string
  nickname: string
}) => {
  if (!data.email || !data.password || !data.nickname)
    throw new Error('data is incomplete')
  if ((await userRepo.getUserByEmail(data.email)) !== null) {
    throw new Error('user already exists')
  }
  return userRepo.createUser(data)
}

export const updateUser = async (
  id: string,
  data: Partial<{ nickname: string; password: string; status: UserStatus }>
) => {
  if (Object.keys(data).length === 0) throw new Error('data is incomplete')
  if ((await userRepo.getUserById(id)) === null) {
    throw new Error('user does not exist')
  }
  return userRepo.updateUser(id, data)
}

export const deleteUser = async (id: string) => {
  if ((await userRepo.getUserById(id)) === null) {
    throw new Error('user does not exist')
  }
  return userRepo.deleteUser(id)
}
