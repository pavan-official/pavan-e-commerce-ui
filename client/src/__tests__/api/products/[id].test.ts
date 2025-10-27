import { GET } from '@/app/api/products/[id]/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/products/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return product details', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      description: 'Test description',
      category: { name: 'Electronics' },
      variants: [
        {
          id: 'v1',
          name: 'Size: Large',
          sku: 'TEST-L',
          price: 99.99,
          quantity: 10,
        },
      ],
      reviews: [
        {
          id: 'r1',
          rating: 5,
          title: 'Great product',
          content: 'Love it!',
          user: { name: 'John Doe', avatar: null },
        },
      ],
      _count: { reviews: 1 },
    }

    mockPrisma.product.findUnique.mockResolvedValue(mockProduct)

    const request = new NextRequest('http://localhost:3000/api/products/1')
    const response = await GET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockProduct)
    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: {
        category: true,
        variants: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    })
  })

  it('should return 404 for non-existent product', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/products/nonexistent')
    const response = await GET(request, { params: { id: 'nonexistent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('PRODUCT_NOT_FOUND')
    expect(data.error.message).toBe('Product not found')
  })

  it('should handle database errors', async () => {
    mockPrisma.product.findUnique.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/products/1')
    const response = await GET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
  })

  it('should include all required relations', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      category: { name: 'Electronics' },
      variants: [],
      reviews: [],
      _count: { reviews: 0 },
    }

    mockPrisma.product.findUnique.mockResolvedValue(mockProduct)

    const request = new NextRequest('http://localhost:3000/api/products/1')
    await GET(request, { params: { id: '1' } })

    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: {
        category: true,
        variants: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    })
  })
})
