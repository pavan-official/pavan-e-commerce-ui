import { DELETE, PUT } from '@/app/api/products/[id]/route'
import { POST } from '@/app/api/products/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    orderItem: {
      findFirst: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Product CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/products', () => {
    it('should create a new product successfully', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        price: 99.99,
        sku: 'TEST001',
        quantity: 10,
        categoryId: 'cat1',
        category: { name: 'Electronics' },
        variants: [],
      }

      const mockCategory = {
        id: 'cat1',
        name: 'Electronics',
      }

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)
      mockPrisma.product.findUnique.mockResolvedValue(null) // No existing SKU
      mockPrisma.product.create.mockResolvedValue(mockProduct)

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Product',
          slug: 'test-product',
          description: 'Test description',
          price: 99.99,
          sku: 'TEST001',
          quantity: 10,
          categoryId: 'cat1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockProduct)
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Product',
          slug: 'test-product',
          description: 'Test description',
          price: 99.99,
          sku: 'TEST001',
          quantity: 10,
          categoryId: 'cat1',
        }),
        include: {
          category: true,
          variants: true,
        },
      })
    })

    it('should return validation error for invalid input', async () => {
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: '', // Invalid: empty name
          price: -10, // Invalid: negative price
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return error if SKU already exists', async () => {
      const existingProduct = {
        id: '2',
        sku: 'EXISTING001',
      }

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct)

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Product',
          slug: 'test-product',
          description: 'Test description',
          price: 99.99,
          sku: 'EXISTING001',
          quantity: 10,
          categoryId: 'cat1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('SKU_EXISTS')
    })

    it('should return error if category not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)
      mockPrisma.category.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Product',
          slug: 'test-product',
          description: 'Test description',
          price: 99.99,
          sku: 'TEST001',
          quantity: 10,
          categoryId: 'nonexistent',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CATEGORY_NOT_FOUND')
    })
  })

  describe('PUT /api/products/[id]', () => {
    it('should update a product successfully', async () => {
      const existingProduct = {
        id: '1',
        name: 'Old Product',
        sku: 'OLD001',
        slug: 'old-product',
      }

      const updatedProduct = {
        id: '1',
        name: 'Updated Product',
        sku: 'OLD001',
        slug: 'updated-product',
        category: { name: 'Electronics' },
        variants: [],
        reviews: [],
        _count: { reviews: 0 },
      }

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct)
      mockPrisma.product.update.mockResolvedValue(updatedProduct)

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Product',
          slug: 'updated-product',
        }),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedProduct)
    })

    it('should return error if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Product',
        }),
      })

      const response = await PUT(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })

  describe('DELETE /api/products/[id]', () => {
    it('should delete a product successfully', async () => {
      const existingProduct = {
        id: '1',
        name: 'Test Product',
      }

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct)
      mockPrisma.orderItem.findFirst.mockResolvedValue(null) // No orders
      mockPrisma.product.delete.mockResolvedValue(existingProduct)

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return error if product has orders', async () => {
      const existingProduct = {
        id: '1',
        name: 'Test Product',
      }

      const orderItem = {
        id: 'order1',
        productId: '1',
      }

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct)
      mockPrisma.orderItem.findFirst.mockResolvedValue(orderItem)

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PRODUCT_HAS_ORDERS')
    })

    it('should return error if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products/nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })
})
