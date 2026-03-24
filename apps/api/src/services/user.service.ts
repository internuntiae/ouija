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

export const createUser = async (
  email: string,
  password: string,
  nickname: string
) => {
  const existingUser = await findOneUser(email)

  if (!email || !password || !nickname) {
    throw new Error('Credentials must be provided')
  }

  if (existingUser) {
    throw new Error('User already exists')
  }

  return createOneUser(email, password, nickname)
}
