import { PUT as adminReviewPUT } from '@/app/api/admin/reviews/[reviewId]/route'
import { GET as adminReviewsGET } from '@/app/api/admin/reviews/route'
import { POST as helpfulPOST } from '@/app/api/products/[id]/reviews/[reviewId]/helpful/route'
import { DELETE as reviewDELETE, PUT as reviewPUT } from '@/app/api/products/[id]/reviews/[reviewId]/route'
import { GET as reviewsGET, POST as reviewsPOST } from '@/app/api/products/[id]/reviews/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    reviewHelpfulVote: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.Mock

describe('GET /api/products/[id]/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return reviews for a product', async () => {
    const mockReviews = [
      {
        id: '1',
        rating: 5,
        title: 'Great product!',
        content: 'Really love this product',
        isApproved: true,
        createdAt: new Date(),
        user: { id: '1', name: 'John Doe', email: 'john@example.com', image: null },
        _count: { helpfulVotes: 3 },
      },
    ]

    const mockStats = {
      _avg: { rating: 4.5 },
      _count: { rating: 10 },
    }

    const mockRatingDistribution = [
      { rating: 5, _count: { rating: 6 } },
      { rating: 4, _count: { rating: 3 } },
      { rating: 3, _count: { rating: 1 } },
    ]

    mockPrisma.review.findMany.mockResolvedValue(mockReviews)
    mockPrisma.review.count.mockResolvedValue(1)
    mockPrisma.review.aggregate.mockResolvedValue(mockStats)
    mockPrisma.review.groupBy.mockResolvedValue(mockRatingDistribution)

    const request = new NextRequest('http://localhost/api/products/1/reviews')
    const response = await reviewsGET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.reviews).toHaveLength(1)
    expect(data.data.stats.averageRating).toBe(4.5)
    expect(data.data.stats.totalReviews).toBe(10)
  })

  it('should handle pagination', async () => {
    mockPrisma.review.findMany.mockResolvedValue([])
    mockPrisma.review.count.mockResolvedValue(25)
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } })
    mockPrisma.review.groupBy.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/products/1/reviews?page=2&limit=10')
    const response = await reviewsGET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.pagination.page).toBe(2)
    expect(data.data.pagination.limit).toBe(10)
    expect(data.data.pagination.total).toBe(25)
  })

  it('should handle rating filtering', async () => {
    mockPrisma.review.findMany.mockResolvedValue([])
    mockPrisma.review.count.mockResolvedValue(0)
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } })
    mockPrisma.review.groupBy.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/products/1/reviews?rating=5')
    const response = await reviewsGET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ rating: 5 }),
      })
    )
  })
})

describe('POST /api/products/[id]/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should create a new review', async () => {
    const mockProduct = { id: '1', name: 'Test Product' }
    const mockReview = {
      id: '1',
      productId: '1',
      userId: 'user123',
      rating: 5,
      title: 'Great product!',
      content: 'Really love this product',
      isApproved: false,
      createdAt: new Date(),
      user: { id: 'user123', name: 'John Doe', email: 'john@example.com', image: null },
    }

    mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
    mockPrisma.review.findFirst.mockResolvedValue(null) // No existing review
    mockPrisma.review.create.mockResolvedValue(mockReview)

    const request = new NextRequest('http://localhost/api/products/1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        rating: 5,
        title: 'Great product!',
        content: 'Really love this product',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await reviewsPOST(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.rating).toBe(5)
    expect(data.data.title).toBe('Great product!')
  })

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/products/1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        rating: 5,
        title: 'Great product!',
        content: 'Really love this product',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await reviewsPOST(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 400 for invalid data', async () => {
    const request = new NextRequest('http://localhost/api/products/1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        rating: 6, // Invalid rating
        title: '',
        content: 'Short',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await reviewsPOST(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 if user already reviewed', async () => {
    const mockProduct = { id: '1', name: 'Test Product' }
    const mockExistingReview = { id: '1', userId: 'user123' }

    mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
    mockPrisma.review.findFirst.mockResolvedValue(mockExistingReview)

    const request = new NextRequest('http://localhost/api/products/1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        rating: 5,
        title: 'Great product!',
        content: 'Really love this product',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await reviewsPOST(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('REVIEW_ALREADY_EXISTS')
  })

  it('should return 404 if product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/products/1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        rating: 5,
        title: 'Great product!',
        content: 'Really love this product',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await reviewsPOST(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('PRODUCT_NOT_FOUND')
  })
})

describe('PUT /api/products/[id]/reviews/[reviewId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should update a review', async () => {
    const mockReview = {
      id: '1',
      userId: 'user123',
      rating: 5,
      title: 'Great product!',
      content: 'Really love this product',
    }

    const mockUpdatedReview = {
      ...mockReview,
      title: 'Updated title',
      content: 'Updated content',
      isApproved: false,
      user: { id: 'user123', name: 'John Doe', email: 'john@example.com', image: null },
    }

    mockPrisma.review.findFirst.mockResolvedValue(mockReview)
    mockPrisma.review.update.mockResolvedValue(mockUpdatedReview)

    const request = new NextRequest('http://localhost/api/products/1/reviews/1', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated title',
        content: 'Updated content',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await reviewPUT(request, { params: { id: '1', reviewId: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.title).toBe('Updated title')
  })

  it('should return 404 if review not found', async () => {
    mockPrisma.review.findFirst.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/products/1/reviews/1', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated title',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await reviewPUT(request, { params: { id: '1', reviewId: '1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('REVIEW_NOT_FOUND')
  })
})

describe('DELETE /api/products/[id]/reviews/[reviewId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should delete a review', async () => {
    const mockReview = {
      id: '1',
      userId: 'user123',
    }

    mockPrisma.review.findFirst.mockResolvedValue(mockReview)
    mockPrisma.review.delete.mockResolvedValue(mockReview)

    const request = new NextRequest('http://localhost/api/products/1/reviews/1', {
      method: 'DELETE',
    })

    const response = await reviewDELETE(request, { params: { id: '1', reviewId: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Review deleted successfully')
  })
})

describe('POST /api/products/[id]/reviews/[reviewId]/helpful', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should vote helpful on a review', async () => {
    const mockReview = { id: '1' }
    const mockVote = {
      id: '1',
      reviewId: '1',
      userId: 'user123',
      isHelpful: true,
    }

    mockPrisma.review.findUnique.mockResolvedValue(mockReview)
    mockPrisma.reviewHelpfulVote.findFirst.mockResolvedValue(null) // No existing vote
    mockPrisma.reviewHelpfulVote.create.mockResolvedValue(mockVote)

    const request = new NextRequest('http://localhost/api/products/1/reviews/1/helpful', {
      method: 'POST',
      body: JSON.stringify({ isHelpful: true }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await helpfulPOST(request, { params: { id: '1', reviewId: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.isHelpful).toBe(true)
  })

  it('should update existing vote', async () => {
    const mockReview = { id: '1' }
    const mockExistingVote = {
      id: '1',
      reviewId: '1',
      userId: 'user123',
      isHelpful: false,
    }
    const mockUpdatedVote = {
      ...mockExistingVote,
      isHelpful: true,
    }

    mockPrisma.review.findUnique.mockResolvedValue(mockReview)
    mockPrisma.reviewHelpfulVote.findFirst.mockResolvedValue(mockExistingVote)
    mockPrisma.reviewHelpfulVote.update.mockResolvedValue(mockUpdatedVote)

    const request = new NextRequest('http://localhost/api/products/1/reviews/1/helpful', {
      method: 'POST',
      body: JSON.stringify({ isHelpful: true }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await helpfulPOST(request, { params: { id: '1', reviewId: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.isHelpful).toBe(true)
  })
})

describe('GET /api/admin/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin123', email: 'admin@example.com' } })
  })

  it('should return reviews for admin moderation', async () => {
    const mockUser = { role: 'ADMIN' }
    const mockReviews = [
      {
        id: '1',
        rating: 5,
        title: 'Great product!',
        content: 'Really love this product',
        isApproved: false,
        createdAt: new Date(),
        user: { id: '1', name: 'John Doe', email: 'john@example.com', image: null },
        product: { id: '1', name: 'Test Product', slug: 'test-product', thumbnail: null },
        _count: { helpfulVotes: 3 },
      },
    ]

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.review.findMany.mockResolvedValue(mockReviews)
    mockPrisma.review.count.mockResolvedValue(1)
    mockPrisma.review.aggregate.mockResolvedValue({ _count: { id: 1 } })
    mockPrisma.review.count.mockResolvedValueOnce(1) // pending
    mockPrisma.review.count.mockResolvedValueOnce(0) // approved
    mockPrisma.review.count.mockResolvedValueOnce(0) // rejected

    const request = new NextRequest('http://localhost/api/admin/reviews?status=pending')
    const response = await adminReviewsGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.reviews).toHaveLength(1)
    expect(data.data.stats.pending).toBe(1)
  })

  it('should return 403 if user is not admin', async () => {
    const mockUser = { role: 'USER' }
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost/api/admin/reviews')
    const response = await adminReviewsGET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('PUT /api/admin/reviews/[reviewId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin123', email: 'admin@example.com' } })
  })

  it('should approve a review', async () => {
    const mockUser = { role: 'ADMIN' }
    const mockReview = {
      id: '1',
      userId: 'user123',
      productId: '1',
      user: { id: 'user123', name: 'John Doe', email: 'john@example.com' },
      product: { id: '1', name: 'Test Product' },
    }

    const mockUpdatedReview = {
      ...mockReview,
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: 'admin123',
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.review.findUnique.mockResolvedValue(mockReview)
    mockPrisma.review.update.mockResolvedValue(mockUpdatedReview)
    mockPrisma.notification.create.mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/admin/reviews/1', {
      method: 'PUT',
      body: JSON.stringify({ action: 'approve' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await adminReviewPUT(request, { params: { reviewId: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.isApproved).toBe(true)
  })

  it('should reject a review', async () => {
    const mockUser = { role: 'ADMIN' }
    const mockReview = {
      id: '1',
      userId: 'user123',
      productId: '1',
      user: { id: 'user123', name: 'John Doe', email: 'john@example.com' },
      product: { id: '1', name: 'Test Product' },
    }

    const mockUpdatedReview = {
      ...mockReview,
      isApproved: false,
      rejectedAt: new Date(),
      rejectedBy: 'admin123',
      rejectionReason: 'Inappropriate content',
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.review.findUnique.mockResolvedValue(mockReview)
    mockPrisma.review.update.mockResolvedValue(mockUpdatedReview)
    mockPrisma.notification.create.mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/admin/reviews/1', {
      method: 'PUT',
      body: JSON.stringify({ 
        action: 'reject',
        reason: 'Inappropriate content'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await adminReviewPUT(request, { params: { reviewId: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.isApproved).toBe(false)
  })
})
