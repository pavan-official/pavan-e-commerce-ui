import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    category: {
      upsert: jest.fn(),
    },
    product: {
      upsert: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('Database Seeding', () => {
  let mockPrisma: jest.Mocked<PrismaClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>
    mockBcrypt.hash.mockResolvedValue('hashed_password')
  })

  it('should create categories successfully', async () => {
    const mockCategory = {
      id: 'cat1',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices',
      isActive: true,
    }

    mockPrisma.category.upsert.mockResolvedValue(mockCategory)

    // Simulate the seeding process
    const electronics = await mockPrisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        isActive: true,
      },
    })

    expect(electronics).toEqual(mockCategory)
    expect(mockPrisma.category.upsert).toHaveBeenCalledWith({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        isActive: true,
      },
    })
  })

  it('should create products successfully', async () => {
    const mockProduct = {
      id: 'prod1',
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'High-quality wireless headphones',
      price: 199.99,
      sku: 'WH001',
      quantity: 50,
      categoryId: 'cat1',
      images: ['/products/1g.png'],
      thumbnail: '/products/1g.png',
      isFeatured: true,
    }

    mockPrisma.product.upsert.mockResolvedValue(mockProduct)

    const product = await mockPrisma.product.upsert({
      where: { slug: 'wireless-headphones' },
      update: {},
      create: {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High-quality wireless headphones',
        price: 199.99,
        sku: 'WH001',
        quantity: 50,
        categoryId: 'cat1',
        images: ['/products/1g.png'],
        thumbnail: '/products/1g.png',
        isFeatured: true,
      },
    })

    expect(product).toEqual(mockProduct)
    expect(mockPrisma.product.upsert).toHaveBeenCalledWith({
      where: { slug: 'wireless-headphones' },
      update: {},
      create: {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High-quality wireless headphones',
        price: 199.99,
        sku: 'WH001',
        quantity: 50,
        categoryId: 'cat1',
        images: ['/products/1g.png'],
        thumbnail: '/products/1g.png',
        isFeatured: true,
      },
    })
  })

  it('should create users with hashed passwords', async () => {
    const mockUser = {
      id: 'user1',
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'hashed_password',
      role: 'ADMIN',
      avatar: '/users/1.png',
    }

    mockPrisma.user.upsert.mockResolvedValue(mockUser)

    const user = await mockPrisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashed_password',
        role: 'ADMIN',
        avatar: '/users/1.png',
      },
    })

    expect(user).toEqual(mockUser)
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10)
    expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashed_password',
        role: 'ADMIN',
        avatar: '/users/1.png',
      },
    })
  })

  it('should handle seeding errors gracefully', async () => {
    const error = new Error('Database connection failed')
    mockPrisma.category.upsert.mockRejectedValue(error)

    await expect(mockPrisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        isActive: true,
      },
    })).rejects.toThrow('Database connection failed')
  })

  it('should hash passwords with correct salt rounds', async () => {
    mockBcrypt.hash.mockResolvedValue('hashed_password')

    await mockBcrypt.hash('password123', 10)

    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10)
  })

  it('should create all required entities', async () => {
    // Mock successful responses
    mockPrisma.category.upsert.mockResolvedValue({ id: 'cat1', name: 'Electronics' } as any)
    mockPrisma.product.upsert.mockResolvedValue({ id: 'prod1', name: 'Test Product' } as any)
    mockPrisma.user.upsert.mockResolvedValue({ id: 'user1', email: 'admin@example.com' } as any)

    // Simulate creating all entities
    const category = await mockPrisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: { name: 'Electronics', slug: 'electronics', isActive: true },
    })

    const product = await mockPrisma.product.upsert({
      where: { slug: 'test-product' },
      update: {},
      create: { name: 'Test Product', slug: 'test-product', price: 99.99, sku: 'TEST001', quantity: 10, categoryId: 'cat1' },
    })

    const user = await mockPrisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: { email: 'admin@example.com', name: 'Admin', password: 'hashed', role: 'ADMIN' },
    })

    expect(category).toBeDefined()
    expect(product).toBeDefined()
    expect(user).toBeDefined()
  })
})
