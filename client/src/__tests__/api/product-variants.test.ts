import { DELETE, PUT } from '@/app/api/products/[id]/variants/[variantId]/route'
import { GET, POST } from '@/app/api/products/[id]/variants/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderItem: {
      findFirst: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Product Variants API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/products/[id]/variants', () => {
    it('should return product variants', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
      }

      const mockVariants = [
        {
          id: 'v1',
          name: 'Size: Large',
          sku: 'TEST-L',
          price: 99.99,
          quantity: 10,
          attributes: { size: 'L', color: 'red' },
        },
        {
          id: 'v2',
          name: 'Size: Medium',
          sku: 'TEST-M',
          price: 89.99,
          quantity: 15,
          attributes: { size: 'M', color: 'red' },
        },
      ]

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.productVariant.findMany.mockResolvedValue(mockVariants)

      const request = new NextRequest('http://localhost:3000/api/products/1/variants')
      const response = await GET(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockVariants)
      expect(mockPrisma.productVariant.findMany).toHaveBeenCalledWith({
        where: { productId: '1' },
        orderBy: { createdAt: 'asc' },
      })
    })

    it('should return error if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products/nonexistent/variants')
      const response = await GET(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })

  describe('POST /api/products/[id]/variants', () => {
    it('should create a new variant successfully', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
      }

      const mockVariant = {
        id: 'v1',
        productId: '1',
        name: 'Size: Large',
        sku: 'TEST-L',
        price: 99.99,
        quantity: 10,
        attributes: { size: 'L', color: 'red' },
        isActive: true,
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.productVariant.findUnique.mockResolvedValue(null) // No existing SKU
      mockPrisma.productVariant.create.mockResolvedValue(mockVariant)

      const request = new NextRequest('http://localhost:3000/api/products/1/variants', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Size: Large',
          sku: 'TEST-L',
          price: 99.99,
          quantity: 10,
          attributes: { size: 'L', color: 'red' },
        }),
      })

      const response = await POST(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockVariant)
      expect(mockPrisma.productVariant.create).toHaveBeenCalledWith({
        data: {
          productId: '1',
          name: 'Size: Large',
          sku: 'TEST-L',
          price: 99.99,
          quantity: 10,
          attributes: { size: 'L', color: 'red' },
          image: undefined,
          isActive: true,
        },
      })
    })

    it('should return validation error for invalid input', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)

      const request = new NextRequest('http://localhost:3000/api/products/1/variants', {
        method: 'POST',
        body: JSON.stringify({
          name: '', // Invalid: empty name
          sku: '', // Invalid: empty SKU
          price: -10, // Invalid: negative price
        }),
      })

      const response = await POST(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return error if variant SKU already exists', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
      }

      const existingVariant = {
        id: 'v2',
        sku: 'EXISTING-L',
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.productVariant.findUnique.mockResolvedValue(existingVariant)

      const request = new NextRequest('http://localhost:3000/api/products/1/variants', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Size: Large',
          sku: 'EXISTING-L',
          price: 99.99,
          quantity: 10,
        }),
      })

      const response = await POST(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('SKU_EXISTS')
    })
  })

  describe('PUT /api/products/[id]/variants/[variantId]', () => {
    it('should update a variant successfully', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
      }

      const existingVariant = {
        id: 'v1',
        productId: '1',
        name: 'Size: Large',
        sku: 'TEST-L',
      }

      const updatedVariant = {
        id: 'v1',
        productId: '1',
        name: 'Size: Extra Large',
        sku: 'TEST-L',
        price: 109.99,
        quantity: 5,
        attributes: { size: 'XL', color: 'red' },
        isActive: true,
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.productVariant.findFirst.mockResolvedValue(existingVariant)
      mockPrisma.productVariant.update.mockResolvedValue(updatedVariant)

      const request = new NextRequest('http://localhost:3000/api/products/1/variants/v1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Size: Extra Large',
          price: 109.99,
          quantity: 5,
          attributes: { size: 'XL', color: 'red' },
        }),
      })

      const response = await PUT(request, { params: { id: '1', variantId: 'v1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedVariant)
    })

    it('should return error if variant not found', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.productVariant.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products/1/variants/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Variant',
        }),
      })

      const response = await PUT(request, { params: { id: '1', variantId: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VARIANT_NOT_FOUND')
    })
  })

  describe('DELETE /api/products/[id]/variants/[variantId]', () => {
    it('should delete a variant successfully', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
      }

      const existingVariant = {
        id: 'v1',
        productId: '1',
        name: 'Size: Large',
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.productVariant.findFirst.mockResolvedValue(existingVariant)
      mockPrisma.orderItem.findFirst.mockResolvedValue(null) // No orders
      mockPrisma.productVariant.delete.mockResolvedValue(existingVariant)

      const request = new NextRequest('http://localhost:3000/api/products/1/variants/v1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1', variantId: 'v1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.productVariant.delete).toHaveBeenCalledWith({
        where: { id: 'v1' },
      })
    })

    it('should return error if variant has orders', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
      }

      const existingVariant = {
        id: 'v1',
        productId: '1',
        name: 'Size: Large',
      }

      const orderItem = {
        id: 'order1',
        variantId: 'v1',
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.productVariant.findFirst.mockResolvedValue(existingVariant)
      mockPrisma.orderItem.findFirst.mockResolvedValue(orderItem)

      const request = new NextRequest('http://localhost:3000/api/products/1/variants/v1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1', variantId: 'v1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VARIANT_HAS_ORDERS')
    })
  })
})
