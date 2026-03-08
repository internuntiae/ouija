import { prisma } from '@/lib'
import { hash } from '@utils/hash'

export const findAllUsers = async () => {
  return prisma.user.findMany()
}

export const findOneUser = async (email: string) => {
  return prisma.user.findUnique({
    where: { email: email }
  })
}

export const createOneUser = async (
  email: string,
  password: string,
  nickname: string
) => {
  hash.update(password)
  return prisma.user.create({
    data: {
      email: email,
      password: hash.copy().digest('hex'),
      nickname: nickname
    }
  })
}
