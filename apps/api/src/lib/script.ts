import { prisma } from '@lib/prisma'

async function main() {
  // Create a new user with a post
  const user = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@pris8ma.io',
      posts: {
        create: {
          title: 'Hello World',
          content: 'This is my first post!',
          published: true
        }
      }
    },
    include: {
      posts: true
    }
  })
  console.log('Created user:', user)

  // Fetch all users with their posts
  const allUsers = await prisma.user.findMany({
    include: {
      posts: true
    }
  })
  console.log('All users:', JSON.stringify(allUsers, null, 2))
}

export { main }
