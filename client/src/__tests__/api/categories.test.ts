import { GET } from '@/app/api/categories/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return active categories with product counts', async () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        image: '/images/electronics.jpg',
        parentId: null,
        _count: { products: 5 },
        children: [
          {
            id: '2',
            name: 'Smartphones',
            slug: 'smartphones',
            _count: { products: 3 },
          },
        ],
      },
    ]

    mockPrisma.category.findMany.mockResolvedValue(mockCategories)

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockCategories)
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
        children: {
          where: { isActive: true },
          include: {
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  })

  it('should return empty array when no categories exist', async () => {
    mockPrisma.category.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should handle database errors', async () => {
    mockPrisma.category.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
  })

  it('should only return active categories', async () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Active Category',
        slug: 'active-category',
        isActive: true,
        _count: { products: 2 },
        children: [],
      },
    ]

    mockPrisma.category.findMany.mockResolvedValue(mockCategories)

    const request = new NextRequest('http://localhost:3000/api/categories')
    await GET(request)

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
        children: {
          where: { isActive: true },
          include: {
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  })

  it('should include nested children categories', async () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        _count: { products: 10 },
        children: [
          {
            id: '2',
            name: 'Smartphones',
            slug: 'smartphones',
            _count: { products: 5 },
          },
          {
            id: '3',
            name: 'Laptops',
            slug: 'laptops',
            _count: { products: 3 },
          },
        ],
      },
    ]

    mockPrisma.category.findMany.mockResolvedValue(mockCategories)

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data[0].children).toHaveLength(2)
    expect(data.data[0].children[0].name).toBe('Smartphones')
    expect(data.data[0].children[1].name).toBe('Laptops')
  })
})
