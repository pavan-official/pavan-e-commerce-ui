import { GET as dashboardGET } from '@/app/api/analytics/dashboard/route'
import { GET as productsGET } from '@/app/api/analytics/products/route'
import { GET as salesGET } from '@/app/api/analytics/sales/route'
import { GET as usersGET } from '@/app/api/analytics/users/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    review: {
      groupBy: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.MockedGenericFunction<typeof getServerSession>

describe('Analytics API Routes', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
  }

  const mockAdminUser = {
    id: 'user-1',
    role: 'ADMIN',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue(mockSession)
    mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser)
  })

  describe('Dashboard Analytics', () => {
    it('should return dashboard overview for admin user', async () => {
      // Mock dashboard data
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { total: 1000 },
        _count: { total: 10 },
        _avg: { total: 100 },
        _min: { total: 50 },
        _max: { total: 200 },
      })

      mockPrisma.order.count.mockResolvedValue(10)
      mockPrisma.user.count.mockResolvedValue(5)
      mockPrisma.product.count.mockResolvedValue(20)

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard')
      const response = await dashboardGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('overview')
      expect(data.data).toHaveProperty('today')
      expect(data.data).toHaveProperty('recentOrders')
      expect(data.data).toHaveProperty('topProducts')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard')
      const response = await dashboardGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 for non-admin user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard')
      const response = await dashboardGET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('Sales Analytics', () => {
    it('should return sales analytics with default parameters', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          total: 100,
          createdAt: new Date(),
          status: 'COMPLETED',
          items: [
            {
              quantity: 2,
              price: 50,
              product: {
                id: 'product-1',
                name: 'Test Product',
                category: { id: 'cat-1', name: 'Electronics' },
              },
            },
          ],
        },
      ]

      mockPrisma.order.findMany.mockResolvedValue(mockOrders)

      const request = new NextRequest('http://localhost:3000/api/analytics/sales')
      const response = await salesGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('summary')
      expect(data.data).toHaveProperty('chartData')
      expect(data.data).toHaveProperty('topProducts')
    })

    it('should return sales analytics with custom parameters', async () => {
      const mockOrders = []
      mockPrisma.order.findMany.mockResolvedValue(mockOrders)

      const request = new NextRequest('http://localhost:3000/api/analytics/sales?period=week&groupBy=day')
      const response = await salesGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for invalid parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/sales?period=invalid')
      const response = await salesGET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('User Analytics', () => {
    it('should return user analytics data', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          createdAt: new Date(),
          role: 'USER',
          _count: { orders: 2, reviews: 1 },
        },
      ]

      mockPrisma.user.findMany.mockResolvedValue(mockUsers)
      mockPrisma.user.count.mockResolvedValue(5)

      const request = new NextRequest('http://localhost:3000/api/analytics/users')
      const response = await usersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('summary')
      expect(data.data).toHaveProperty('metrics')
      expect(data.data).toHaveProperty('chartData')
    })
  })

  describe('Product Analytics', () => {
    it('should return product analytics data', async () => {
      const mockOrderItems = [
        {
          productId: 'product-1',
          quantity: 2,
          price: 50,
          product: {
            id: 'product-1',
            name: 'Test Product',
            stock: 10,
            isActive: true,
            category: { id: 'cat-1', name: 'Electronics' },
            _count: { reviews: 5 },
          },
          order: {
            createdAt: new Date(),
            status: 'COMPLETED',
          },
        },
      ]

      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product',
          stock: 10,
          isActive: true,
          category: { id: 'cat-1', name: 'Electronics' },
          _count: { reviews: 5, orderItems: 2 },
        },
      ]

      mockPrisma.orderItem.findMany.mockResolvedValue(mockOrderItems)
      mockPrisma.product.findMany.mockResolvedValue(mockProducts)
      mockPrisma.review.groupBy.mockResolvedValue([
        {
          productId: 'product-1',
          _avg: { rating: 4.5 },
          _count: { rating: 5 },
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/analytics/products')
      const response = await productsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('summary')
      expect(data.data).toHaveProperty('topPerformers')
      expect(data.data).toHaveProperty('categoryAnalytics')
      expect(data.data).toHaveProperty('inventoryStatus')
    })

    it('should return product analytics with category filter', async () => {
      mockPrisma.orderItem.findMany.mockResolvedValue([])
      mockPrisma.product.findMany.mockResolvedValue([])
      mockPrisma.review.groupBy.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/analytics/products?categoryId=cat-1')
      const response = await productsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.order.aggregate.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard')
      const response = await dashboardGET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
    })
  })
})
