import { DELETE } from '@/app/api/wishlist/[itemId]/route'
import { GET, POST } from '@/app/api/wishlist/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wishlistItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.MockedGenericFunction<typeof getServerSession>

describe('Wishlist API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/wishlist', () => {
    it('should return wishlist items for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockWishlistItems = [
        {
          id: 'wish1',
          productId: 'prod1',
          product: {
            id: 'prod1',
            name: 'Test Product',
            price: 99.99,
            thumbnail: '/images/product1.jpg',
            category: { name: 'Electronics' },
            variants: [],
            _count: { reviews: 5 },
          },
          createdAt: '2023-01-01T00:00:00Z',
        },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.wishlistItem.findMany.mockResolvedValue(mockWishlistItems)

      const request = new NextRequest('http://localhost:3000/api/wishlist')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockWishlistItems)
      expect(mockPrisma.wishlistItem.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          product: {
            include: {
              category: true,
              variants: true,
              _count: { select: { reviews: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/wishlist')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('POST /api/wishlist', () => {
    it('should add item to wishlist successfully', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockProduct = {
        id: 'prod1',
        name: 'Test Product',
        price: 99.99,
      }

      const mockWishlistItem = {
        id: 'wish1',
        userId: 'user1',
        productId: 'prod1',
        product: {
          id: 'prod1',
          name: 'Test Product',
          price: 99.99,
          thumbnail: '/images/product1.jpg',
          category: { name: 'Electronics' },
          variants: [],
          _count: { reviews: 5 },
        },
        createdAt: '2023-01-01T00:00:00Z',
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null) // No existing item
      mockPrisma.wishlistItem.create.mockResolvedValue(mockWishlistItem)

      const request = new NextRequest('http://localhost:3000/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'prod1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockWishlistItem)
      expect(mockPrisma.wishlistItem.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          productId: 'prod1',
        },
        include: {
          product: {
            include: {
              category: true,
              variants: true,
              _count: { select: { reviews: true } },
            },
          },
        },
      })
    })

    it('should return error if product not found', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.product.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'nonexistent',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND')
    })

    it('should return error if item already in wishlist', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockProduct = {
        id: 'prod1',
        name: 'Test Product',
        price: 99.99,
      }

      const existingItem = {
        id: 'wish1',
        userId: 'user1',
        productId: 'prod1',
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(existingItem)

      const request = new NextRequest('http://localhost:3000/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'prod1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('ITEM_ALREADY_IN_WISHLIST')
    })

    it('should return validation error for invalid input', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({
          productId: '', // Invalid: empty product ID
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /api/wishlist/[itemId]', () => {
    it('should remove item from wishlist', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const existingItem = {
        id: 'wish1',
        userId: 'user1',
        productId: 'prod1',
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.wishlistItem.findFirst.mockResolvedValue(existingItem)
      mockPrisma.wishlistItem.delete.mockResolvedValue(existingItem)

      const request = new NextRequest('http://localhost:3000/api/wishlist/wish1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { itemId: 'wish1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.wishlistItem.delete).toHaveBeenCalledWith({
        where: { id: 'wish1' },
      })
    })

    it('should return error if wishlist item not found', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.wishlistItem.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/wishlist/nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { itemId: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('WISHLIST_ITEM_NOT_FOUND')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/wishlist/wish1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { itemId: 'wish1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })
})
