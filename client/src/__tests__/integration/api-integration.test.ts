import { GET as getCategories } from '@/app/api/categories/route'
import { GET as getProduct } from '@/app/api/products/[id]/route'
import { GET } from '@/app/api/products/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Products API Integration', () => {
    it('should handle complete product flow', async () => {
      // Mock products list
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

      // Test products list endpoint
      const listRequest = new NextRequest('http://localhost:3000/api/products')
      const listResponse = await GET(listRequest)
      const listData = await listResponse.json()

      expect(listResponse.status).toBe(200)
      expect(listData.success).toBe(true)
      expect(listData.data).toHaveLength(1)

      // Mock individual product
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        description: 'Test description',
        category: { name: 'Electronics' },
        variants: [],
        reviews: [],
        _count: { reviews: 5 },
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)

      // Test individual product endpoint
      const productRequest = new NextRequest('http://localhost:3000/api/products/1')
      const productResponse = await getProduct(productRequest, { params: { id: '1' } })
      const productData = await productResponse.json()

      expect(productResponse.status).toBe(200)
      expect(productData.success).toBe(true)
      expect(productData.data.id).toBe('1')
    })

    it('should handle product not found scenario', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products/nonexistent')
      const response = await getProduct(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })

  describe('Categories API Integration', () => {
    it('should return categories with nested structure', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices',
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
      const response = await getCategories(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data[0].children).toHaveLength(1)
      expect(data.data[0].children[0].name).toBe('Smartphones')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database connection errors consistently', async () => {
      const dbError = new Error('Database connection failed')
      
      // Test products endpoint error
      mockPrisma.product.findMany.mockRejectedValue(dbError)
      
      const productsRequest = new NextRequest('http://localhost:3000/api/products')
      const productsResponse = await GET(productsRequest)
      const productsData = await productsResponse.json()

      expect(productsResponse.status).toBe(500)
      expect(productsData.success).toBe(false)
      expect(productsData.error.code).toBe('INTERNAL_SERVER_ERROR')

      // Test categories endpoint error
      mockPrisma.category.findMany.mockRejectedValue(dbError)
      
      const categoriesRequest = new NextRequest('http://localhost:3000/api/categories')
      const categoriesResponse = await getCategories(categoriesRequest)
      const categoriesData = await categoriesResponse.json()

      expect(categoriesResponse.status).toBe(500)
      expect(categoriesData.success).toBe(false)
      expect(categoriesData.error.code).toBe('INTERNAL_SERVER_ERROR')
    })
  })

  describe('Pagination Integration', () => {
    it('should handle pagination parameters correctly', async () => {
      const mockProducts = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Product ${i + 1}`,
        price: 99.99,
        description: 'Test description',
        category: { name: 'Electronics' },
        variants: [],
        _count: { reviews: 0 },
      }))

      mockPrisma.product.findMany.mockResolvedValue(mockProducts)
      mockPrisma.product.count.mockResolvedValue(25)

      const request = new NextRequest('http://localhost:3000/api/products?page=2&limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.meta.page).toBe(2)
      expect(data.meta.limit).toBe(5)
      expect(data.meta.total).toBe(25)
      expect(data.meta.totalPages).toBe(5)

      // Verify Prisma was called with correct pagination
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
        take: 5,
        include: {
          category: true,
          variants: true,
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('Search and Filter Integration', () => {
    it('should handle search and category filter together', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Wireless Headphones',
          price: 199.99,
          description: 'High-quality wireless headphones',
          category: { name: 'Electronics' },
          variants: [],
          _count: { reviews: 5 },
        },
      ]

      mockPrisma.product.findMany.mockResolvedValue(mockProducts)
      mockPrisma.product.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/products?search=headphones&category=electronics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify Prisma was called with both search and category filter
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          category: { slug: 'electronics' },
          OR: [
            { name: { contains: 'headphones', mode: 'insensitive' } },
            { description: { contains: 'headphones', mode: 'insensitive' } },
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
  })
})
