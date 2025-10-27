import { GET } from '@/app/api/products/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return products with pagination', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        description: 'Test description',
        category: { name: 'Electronics' },
        variants: [],
        _count: { reviews: 5 },
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)

    const request = new NextRequest('http://localhost:3000/api/products?page=1&limit=10')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockProducts)
    expect(data.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
  })

  it('should filter products by category', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Electronics Product',
        price: 99.99,
        description: 'Test description',
        category: { name: 'Electronics' },
        variants: [],
        _count: { reviews: 0 },
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)

    const request = new NextRequest('http://localhost:3000/api/products?category=electronics')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
      where: {
        category: { slug: 'electronics' },
      },
      skip: 0,
      take: 10,
      include: {
        category: true,
        variants: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should search products by name and description', async () => {
    const mockProducts = []
    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost:3000/api/products?search=laptop')
    const response = await GET(request)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'laptop', mode: 'insensitive' } },
          { description: { contains: 'laptop', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 10,
      include: {
        category: true,
        variants: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should handle database errors', async () => {
    mockPrisma.product.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/products')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
  })

  it('should use default pagination values', async () => {
    const mockProducts = []
    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost:3000/api/products')
    await GET(request)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      include: {
        category: true,
        variants: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })
})
