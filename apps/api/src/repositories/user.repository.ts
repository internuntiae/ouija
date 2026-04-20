import { prisma } from '@/lib'
import { UserStatus } from '@prisma/client'

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } })
}

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } })
}

export const getUserByNickname = async (nickname: string) => {
  return prisma.user.findUnique({ where: { nickname } })
}

export const getUsers = async () => {
  return prisma.user.findMany()
}

export const createUser = async (data: {
  email: string
  password: string
  nickname: string
}) => {
  return prisma.user.create({ data })
}

export const updateUser = async (
  id: string,
  data: Partial<{ nickname: string; password: string; status: UserStatus }>
) => {
  return prisma.user.update({ where: { id }, data })
}

export const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } })
}
