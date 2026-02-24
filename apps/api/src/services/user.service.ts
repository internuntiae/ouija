import {
  findAllUsers,
  findOneUser,
  createOneUser
} from '@repositories/user.repository'

export const getAllUsers = async () => {
  return findAllUsers()
}

export const getUser = async (id: string) => {
  return findOneUser(id)
}

export const createUser = async (id: string) => {
  const existingUser = await findOneUser(id)

  if (existingUser) {
    throw new Error('User already exists')
  }

  return createOneUser(id)
}
