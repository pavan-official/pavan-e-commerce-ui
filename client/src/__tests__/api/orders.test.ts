import { PUT, GET as getOrder } from '@/app/api/orders/[id]/route'
import { GET, POST } from '@/app/api/orders/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    cartItem: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    orderItem: {
      createMany: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    productVariant: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.MockedGenericFunction<typeof getServerSession>

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/orders', () => {
    it('should return orders for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockOrders = [
        {
          id: 'order1',
          orderNumber: 'ORD-123',
          status: 'PENDING',
          total: 99.99,
          items: [],
          payments: [],
        },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findMany.mockResolvedValue(mockOrders)
      mockPrisma.order.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockOrders)
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        skip: 0,
        take: 10,
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
              variant: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should filter orders by status', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockOrders = [
        {
          id: 'order1',
          orderNumber: 'ORD-123',
          status: 'SHIPPED',
          total: 99.99,
          items: [],
          payments: [],
        },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findMany.mockResolvedValue(mockOrders)
      mockPrisma.order.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/orders?status=SHIPPED')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', status: 'SHIPPED' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('POST /api/orders', () => {
    it('should create order successfully', async () => {
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
            quantity: 10,
          },
          variant: null,
        },
      ]

      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'PENDING',
        total: 215.97, // 199.98 + 16.00 tax + 9.99 shipping
        items: [],
        payments: [],
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.cartItem.findMany.mockResolvedValue(mockCartItems)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          order: {
            create: jest.fn().mockResolvedValue(mockOrder),
          },
          orderItem: {
            createMany: jest.fn().mockResolvedValue({}),
          },
          product: {
            update: jest.fn().mockResolvedValue({}),
          },
          cartItem: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
        })
      })
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder)

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          billingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          paymentMethod: 'credit_card',
          shippingMethod: 'standard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockOrder)
    })

    it('should return error for empty cart', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.cartItem.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          billingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          paymentMethod: 'credit_card',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('EMPTY_CART')
    })

    it('should return error for insufficient stock', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockCartItems = [
        {
          id: 'cart1',
          productId: 'prod1',
          quantity: 5, // Requesting 5
          product: {
            id: 'prod1',
            name: 'Test Product',
            price: 99.99,
            quantity: 2, // Only 2 available
          },
          variant: null,
        },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.cartItem.findMany.mockResolvedValue(mockCartItems)

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          billingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          paymentMethod: 'credit_card',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INSUFFICIENT_STOCK')
    })

    it('should return validation error for invalid input', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: {
            street: '', // Invalid: empty street
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          paymentMethod: 'credit_card',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/orders/[id]', () => {
    it('should return order details for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'PENDING',
        total: 99.99,
        items: [],
        payments: [],
        user: { id: 'user1', name: 'Test User', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder)

      const request = new NextRequest('http://localhost:3000/api/orders/order1')
      const response = await getOrder(request, { params: { id: 'order1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockOrder)
      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'order1',
          userId: 'user1',
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
              variant: true,
            },
          },
          payments: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    })

    it('should return 404 if order not found', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/orders/nonexistent')
      const response = await getOrder(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('ORDER_NOT_FOUND')
    })
  })

  describe('PUT /api/orders/[id]', () => {
    it('should update order successfully', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const existingOrder = {
        id: 'order1',
        userId: 'user1',
        status: 'PENDING',
      }

      const updatedOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'CONFIRMED',
        total: 99.99,
        items: [],
        payments: [],
        user: { id: 'user1', name: 'Test User', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findFirst.mockResolvedValue(existingOrder)
      mockPrisma.order.update.mockResolvedValue(updatedOrder)

      const request = new NextRequest('http://localhost:3000/api/orders/order1', {
        method: 'PUT',
        body: JSON.stringify({
          status: 'CONFIRMED',
        }),
      })

      const response = await PUT(request, { params: { id: 'order1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedOrder)
    })

    it('should return 404 if order not found', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/orders/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({
          status: 'CONFIRMED',
        }),
      })

      const response = await PUT(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('ORDER_NOT_FOUND')
    })
  })
})
