import { GET as searchGET } from '@/app/api/search/route'
import { GET as suggestionsGET } from '@/app/api/search/suggestions/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    review: {
      aggregate: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('GET /api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return products with basic search', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        price: new Prisma.Decimal(100),
        thumbnail: 'test.jpg',
        images: ['test.jpg'],
        category: { id: '1', name: 'Electronics', slug: 'electronics' },
        variants: [],
        reviews: [{ rating: 5 }],
        _count: { reviews: 1, orderItems: 5 },
        quantity: 10,
        isFeatured: true,
        createdAt: new Date(),
      },
    ]

    const mockAggregations = {
      _min: { price: new Prisma.Decimal(50) },
      _max: { price: new Prisma.Decimal(200) },
      _avg: { price: new Prisma.Decimal(125) },
    }

    const mockCategoryAggregations = [
      { categoryId: '1', _count: { categoryId: 1 } },
    ]

    const mockCategory = {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
    }

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)
    mockPrisma.product.aggregate.mockResolvedValue(mockAggregations)
    mockPrisma.product.groupBy.mockResolvedValue(mockCategoryAggregations)
    mockPrisma.category.findUnique.mockResolvedValue(mockCategory)
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 } })

    const request = new NextRequest('http://localhost/api/search?q=test')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.products).toHaveLength(1)
    expect(data.data.products[0].name).toBe('Test Product')
    expect(data.data.aggregations.price.min).toBe(50)
    expect(data.data.aggregations.price.max).toBe(200)
    expect(data.data.pagination.total).toBe(1)
  })

  it('should handle category filtering', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Electronics Product',
        slug: 'electronics-product',
        description: 'Electronics description',
        price: new Prisma.Decimal(150),
        thumbnail: 'electronics.jpg',
        images: ['electronics.jpg'],
        category: { id: '1', name: 'Electronics', slug: 'electronics' },
        variants: [],
        reviews: [],
        _count: { reviews: 0, orderItems: 0 },
        quantity: 5,
        isFeatured: false,
        createdAt: new Date(),
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { price: new Prisma.Decimal(150) },
      _max: { price: new Prisma.Decimal(150) },
      _avg: { price: new Prisma.Decimal(150) },
    })
    mockPrisma.product.groupBy.mockResolvedValue([])
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } })

    const request = new NextRequest('http://localhost/api/search?category=electronics')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.products).toHaveLength(1)
    expect(data.data.filters.applied.category).toBe('electronics')
  })

  it('should handle price range filtering', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Mid Range Product',
        slug: 'mid-range-product',
        description: 'Mid range description',
        price: new Prisma.Decimal(150),
        thumbnail: 'mid.jpg',
        images: ['mid.jpg'],
        category: { id: '1', name: 'Electronics', slug: 'electronics' },
        variants: [],
        reviews: [],
        _count: { reviews: 0, orderItems: 0 },
        quantity: 3,
        isFeatured: false,
        createdAt: new Date(),
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { price: new Prisma.Decimal(100) },
      _max: { price: new Prisma.Decimal(200) },
      _avg: { price: new Prisma.Decimal(150) },
    })
    mockPrisma.product.groupBy.mockResolvedValue([])
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } })

    const request = new NextRequest('http://localhost/api/search?minPrice=100&maxPrice=200')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.filters.applied.minPrice).toBe(100)
    expect(data.data.filters.applied.maxPrice).toBe(200)
  })

  it('should handle stock filtering', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'In Stock Product',
        slug: 'in-stock-product',
        description: 'In stock description',
        price: new Prisma.Decimal(100),
        thumbnail: 'stock.jpg',
        images: ['stock.jpg'],
        category: { id: '1', name: 'Electronics', slug: 'electronics' },
        variants: [],
        reviews: [],
        _count: { reviews: 0, orderItems: 0 },
        quantity: 10,
        isFeatured: false,
        createdAt: new Date(),
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { price: new Prisma.Decimal(100) },
      _max: { price: new Prisma.Decimal(100) },
      _avg: { price: new Prisma.Decimal(100) },
    })
    mockPrisma.product.groupBy.mockResolvedValue([])
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } })

    const request = new NextRequest('http://localhost/api/search?inStock=true')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.filters.applied.inStock).toBe(true)
  })

  it('should handle featured products filtering', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Featured Product',
        slug: 'featured-product',
        description: 'Featured description',
        price: new Prisma.Decimal(200),
        thumbnail: 'featured.jpg',
        images: ['featured.jpg'],
        category: { id: '1', name: 'Electronics', slug: 'electronics' },
        variants: [],
        reviews: [],
        _count: { reviews: 0, orderItems: 0 },
        quantity: 5,
        isFeatured: true,
        createdAt: new Date(),
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { price: new Prisma.Decimal(200) },
      _max: { price: new Prisma.Decimal(200) },
      _avg: { price: new Prisma.Decimal(200) },
    })
    mockPrisma.product.groupBy.mockResolvedValue([])
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } })

    const request = new NextRequest('http://localhost/api/search?isFeatured=true')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.filters.applied.isFeatured).toBe(true)
  })

  it('should handle rating filtering', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'High Rated Product',
        slug: 'high-rated-product',
        description: 'High rated description',
        price: new Prisma.Decimal(150),
        thumbnail: 'rated.jpg',
        images: ['rated.jpg'],
        category: { id: '1', name: 'Electronics', slug: 'electronics' },
        variants: [],
        reviews: [{ rating: 5 }],
        _count: { reviews: 1, orderItems: 0 },
        quantity: 8,
        isFeatured: false,
        createdAt: new Date(),
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { price: new Prisma.Decimal(150) },
      _max: { price: new Prisma.Decimal(150) },
      _avg: { price: new Prisma.Decimal(150) },
    })
    mockPrisma.product.groupBy.mockResolvedValue([])
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 } })

    const request = new NextRequest('http://localhost/api/search?rating=4')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.filters.applied.rating).toBe(4)
  })

  it('should handle sorting', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'A Product',
        slug: 'a-product',
        description: 'A description',
        price: new Prisma.Decimal(100),
        thumbnail: 'a.jpg',
        images: ['a.jpg'],
        category: { id: '1', name: 'Electronics', slug: 'electronics' },
        variants: [],
        reviews: [],
        _count: { reviews: 0, orderItems: 0 },
        quantity: 5,
        isFeatured: false,
        createdAt: new Date(),
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(1)
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { price: new Prisma.Decimal(100) },
      _max: { price: new Prisma.Decimal(100) },
      _avg: { price: new Prisma.Decimal(100) },
    })
    mockPrisma.product.groupBy.mockResolvedValue([])
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } })

    const request = new NextRequest('http://localhost/api/search?sortBy=name&sortOrder=asc')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.filters.applied.sortBy).toBe('name')
    expect(data.data.filters.applied.sortOrder).toBe('asc')
  })

  it('should handle pagination', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Product 1',
        slug: 'product-1',
        description: 'Product 1 description',
        price: new Prisma.Decimal(100),
        thumbnail: 'product1.jpg',
        images: ['product1.jpg'],
        category: { id: '1', name: 'Electronics', slug: 'electronics' },
        variants: [],
        reviews: [],
        _count: { reviews: 0, orderItems: 0 },
        quantity: 5,
        isFeatured: false,
        createdAt: new Date(),
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.product.count.mockResolvedValue(25)
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { price: new Prisma.Decimal(100) },
      _max: { price: new Prisma.Decimal(100) },
      _avg: { price: new Prisma.Decimal(100) },
    })
    mockPrisma.product.groupBy.mockResolvedValue([])
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } })

    const request = new NextRequest('http://localhost/api/search?page=2&limit=10')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.pagination.page).toBe(2)
    expect(data.data.pagination.limit).toBe(10)
    expect(data.data.pagination.total).toBe(25)
    expect(data.data.pagination.totalPages).toBe(3)
  })

  it('should return 400 for invalid parameters', async () => {
    const request = new NextRequest('http://localhost/api/search?minPrice=invalid')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should handle database errors', async () => {
    mockPrisma.product.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/search')
    const response = await searchGET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
  })
})

describe('GET /api/search/suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return search suggestions', async () => {
    const mockProductSuggestions = [
      {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        thumbnail: 'test.jpg',
        price: new Prisma.Decimal(100),
        category: { name: 'Electronics', slug: 'electronics' },
      },
    ]

    const mockCategorySuggestions = [
      {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        _count: { products: 5 },
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProductSuggestions)
    mockPrisma.category.findMany.mockResolvedValue(mockCategorySuggestions)

    const request = new NextRequest('http://localhost/api/search/suggestions?q=test&limit=5')
    const response = await suggestionsGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.products).toHaveLength(1)
    expect(data.data.categories).toHaveLength(1)
    expect(data.data.products[0].type).toBe('product')
    expect(data.data.categories[0].type).toBe('category')
  })

  it('should return 400 for missing query', async () => {
    const request = new NextRequest('http://localhost/api/search/suggestions')
    const response = await suggestionsGET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should handle database errors', async () => {
    mockPrisma.product.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/search/suggestions?q=test')
    const response = await suggestionsGET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
  })
})
