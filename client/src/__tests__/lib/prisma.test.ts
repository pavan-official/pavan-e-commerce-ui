import { prisma } from '@/lib/prisma'

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  })),
}))

describe('Prisma Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should export prisma client instance', () => {
    expect(prisma).toBeDefined()
    expect(prisma).toHaveProperty('product')
    expect(prisma).toHaveProperty('user')
  })

  it('should have product methods', () => {
    expect(prisma.product).toBeDefined()
    expect(prisma.product.findMany).toBeDefined()
    expect(prisma.product.findUnique).toBeDefined()
  })

  it('should have user methods', () => {
    expect(prisma.user).toBeDefined()
    expect(prisma.user.findUnique).toBeDefined()
    expect(prisma.user.create).toBeDefined()
  })

  it('should be a singleton instance', () => {
    const { prisma: prisma2 } = require('@/lib/prisma')
    expect(prisma).toBe(prisma2)
  })
})
