import { DELETE, PUT } from '@/app/api/cart/[itemId]/route'
import { GET, POST } from '@/app/api/cart/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    cartItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    productVariant: {
      findFirst: jest.fn(),
    },
  },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.MockedGenericFunction<typeof getServerSession>

describe('Cart API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/cart', () => {
    it('should return cart items for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockCartItems = [
        {
          id: 'cart1',
          productId: 'prod1',
          quantity: 2,
          product: {
            id: 'prod1',
            name: 'Test Product',
            price: 99.99,
            category: { name: 'Electronics' },
            variants: [],
          },
          variant: null,
        },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.cartItem.findMany.mockResolvedValue(mockCartItems)

      const request = new NextRequest('http://localhost:3000/api/cart')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.items).toEqual(mockCartItems)
      expect(data.data.summary.subtotal).toBe(199.98)
      expect(data.data.summary.itemCount).toBe(2)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/cart')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('POST /api/cart', () => {
    it('should add item to cart successfully', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockProduct = {
        id: 'prod1',
        name: 'Test Product',
        price: 99.99,
        quantity: 10,
        variants: [],
      }

      const mockCartItem = {
        id: 'cart1',
        userId: 'user1',
        productId: 'prod1',
        quantity: 1,
        product: {
          id: 'prod1',
          name: 'Test Product',
          price: 99.99,
          category: { name: 'Electronics' },
          variants: [],
        },
        variant: null,
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.cartItem.findUnique.mockResolvedValue(null) // No existing item
      mockPrisma.cartItem.create.mockResolvedValue(mockCartItem)

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'prod1',
          quantity: 1,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCartItem)
    })

    it('should update existing cart item quantity', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockProduct = {
        id: 'prod1',
        name: 'Test Product',
        price: 99.99,
        quantity: 10,
        variants: [],
      }

      const existingItem = {
        id: 'cart1',
        userId: 'user1',
        productId: 'prod1',
        quantity: 2,
      }

      const updatedItem = {
        id: 'cart1',
        userId: 'user1',
        productId: 'prod1',
        quantity: 3,
        product: {
          id: 'prod1',
          name: 'Test Product',
          price: 99.99,
          category: { name: 'Electronics' },
          variants: [],
        },
        variant: null,
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.cartItem.findUnique.mockResolvedValue(existingItem)
      mockPrisma.cartItem.update.mockResolvedValue(updatedItem)

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'prod1',
          quantity: 1,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'cart1' },
        data: { quantity: 3 },
        include: {
          product: {
            include: {
              category: true,
              variants: true,
            },
          },
          variant: true,
        },
      })
    })

    it('should return error for insufficient stock', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockProduct = {
        id: 'prod1',
        name: 'Test Product',
        price: 99.99,
        quantity: 2, // Only 2 available
        variants: [],
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.cartItem.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'prod1',
          quantity: 5, // Requesting 5, but only 2 available
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INSUFFICIENT_STOCK')
    })
  })

  describe('PUT /api/cart/[itemId]', () => {
    it('should update cart item quantity', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const existingItem = {
        id: 'cart1',
        userId: 'user1',
        productId: 'prod1',
        quantity: 2,
        product: { quantity: 10 },
        variant: null,
      }

      const updatedItem = {
        id: 'cart1',
        userId: 'user1',
        productId: 'prod1',
        quantity: 3,
        product: {
          id: 'prod1',
          name: 'Test Product',
          price: 99.99,
          category: { name: 'Electronics' },
          variants: [],
        },
        variant: null,
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.cartItem.findFirst.mockResolvedValue(existingItem)
      mockPrisma.cartItem.update.mockResolvedValue(updatedItem)

      const request = new NextRequest('http://localhost:3000/api/cart/cart1', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 3 }),
      })

      const response = await PUT(request, { params: { itemId: 'cart1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedItem)
    })

    it('should return error if cart item not found', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.cartItem.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/cart/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 3 }),
      })

      const response = await PUT(request, { params: { itemId: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CART_ITEM_NOT_FOUND')
    })
  })

  describe('DELETE /api/cart/[itemId]', () => {
    it('should remove item from cart', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const existingItem = {
        id: 'cart1',
        userId: 'user1',
        productId: 'prod1',
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.cartItem.findFirst.mockResolvedValue(existingItem)
      mockPrisma.cartItem.delete.mockResolvedValue(existingItem)

      const request = new NextRequest('http://localhost:3000/api/cart/cart1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { itemId: 'cart1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'cart1' },
      })
    })
  })
})
