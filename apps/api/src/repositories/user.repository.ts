import { prisma } from '@/lib'

export const findAllUsers = async () => {
  return prisma.user.findMany()
}

export const findOneUser = async (id: string) => {
  return prisma.user.findUnique({
    where: { id: id }
  })
}

export const createOneUser = async () => {
  // User creation
}
