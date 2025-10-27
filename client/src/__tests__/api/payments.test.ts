import { GET } from '@/app/api/payments/[paymentId]/route'
import { POST } from '@/app/api/payments/create-intent/route'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

// Mock Stripe
jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      list: jest.fn(),
      create: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
    },
  },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockStripe = stripe as jest.Mocked<typeof stripe>
const mockGetServerSession = getServerSession as jest.MockedGenericFunction<typeof getServerSession>

describe('Payments API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/payments/create-intent', () => {
    it('should create payment intent successfully', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com', name: 'Test User' },
      }

      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        total: 99.99,
        paymentStatus: 'PENDING',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        items: [],
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
      }

      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        status: 'requires_payment_method',
      }

      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        amount: 99.99,
        currency: 'USD',
        status: 'PENDING',
        method: 'CREDIT_CARD',
        provider: 'stripe',
        providerId: 'pi_123',
        providerData: {
          clientSecret: 'pi_123_secret',
          status: 'requires_payment_method',
        },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder)
      mockStripe.customers.list.mockResolvedValue({ data: [] })
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_123' } as any)
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any)
      mockPrisma.payment.create.mockResolvedValue(mockPayment as any)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.clientSecret).toBe('pi_123_secret')
      expect(data.data.amount).toBe(99.99)
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 9999, // 99.99 * 100
        currency: 'usd',
        customer: 'cus_123',
        metadata: {
          orderId: 'order1',
          orderNumber: 'ORD-123',
          userId: 'user1',
        },
        description: 'Payment for order ORD-123',
        shipping: {
          name: '123 Main St',
          address: {
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
            country: 'US',
          },
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 404 if order not found', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'nonexistent' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('ORDER_NOT_FOUND')
    })

    it('should return error if payment already completed', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        total: 99.99,
        paymentStatus: 'COMPLETED', // Already completed
        shippingAddress: {},
        items: [],
        user: { name: 'Test User', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PAYMENT_ALREADY_COMPLETED')
    })

    it('should return validation error for invalid input', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId: '' }), // Invalid: empty order ID
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle existing Stripe customer', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com', name: 'Test User' },
      }

      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        total: 99.99,
        paymentStatus: 'PENDING',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        items: [],
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
      }

      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        status: 'requires_payment_method',
      }

      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        amount: 99.99,
        currency: 'USD',
        status: 'PENDING',
        method: 'CREDIT_CARD',
        provider: 'stripe',
        providerId: 'pi_123',
        providerData: {
          clientSecret: 'pi_123_secret',
          status: 'requires_payment_method',
        },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder)
      mockStripe.customers.list.mockResolvedValue({ 
        data: [{ id: 'cus_existing' }] 
      })
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any)
      mockPrisma.payment.create.mockResolvedValue(mockPayment as any)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(mockStripe.customers.create).not.toHaveBeenCalled()
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing',
        })
      )
    })
  })

  describe('GET /api/payments/[paymentId]', () => {
    it('should return payment details for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      const mockPayment = {
        id: 'payment1',
        status: 'COMPLETED',
        amount: 99.99,
        currency: 'USD',
        method: 'CREDIT_CARD',
        provider: 'stripe',
        providerId: 'pi_123',
        createdAt: '2023-01-01T00:00:00Z',
        processedAt: '2023-01-01T00:01:00Z',
        order: {
          id: 'order1',
          orderNumber: 'ORD-123',
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          total: 99.99,
        },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment as any)

      const request = new NextRequest('http://localhost:3000/api/payments/payment1')
      const response = await GET(request, { params: { paymentId: 'payment1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockPayment)
      expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'payment1',
          order: {
            userId: 'user1',
          },
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              total: true,
            },
          },
        },
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payments/payment1')
      const response = await GET(request, { params: { paymentId: 'payment1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 404 if payment not found', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.payment.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payments/nonexistent')
      const response = await GET(request, { params: { paymentId: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PAYMENT_NOT_FOUND')
    })
  })
})
