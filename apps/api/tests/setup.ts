// Mock the lib/prisma module so no real DB connection is made
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    friendship: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    chat: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    chatUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    message: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    reaction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}))

// Mock redis so no real Redis connection is made
jest.mock('../src/lib/redis', () => ({
  redis: {
    isReady: true,
    ping: jest.fn().mockResolvedValue('PONG'),
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    lRange: jest.fn().mockResolvedValue([]),
    lPush: jest.fn().mockResolvedValue(1),
    rPush: jest.fn().mockResolvedValue(1), // ← was missing
    lRem: jest.fn().mockResolvedValue(1),
    lSet: jest.fn().mockResolvedValue('OK'),
    lTrim: jest.fn().mockResolvedValue('OK'), // ← was missing
    lLen: jest.fn().mockResolvedValue(0), // ← was missing
    expire: jest.fn().mockResolvedValue(true), // ← was missing
    del: jest.fn().mockResolvedValue(1) // ← was missing
  }
}))
