import { getServerUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  content: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Review too long'),
  orderId: z.string().optional(), // Optional: link to order
})

// GET /api/products/[id]/reviews - Get all reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const rating = searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined
    const approvedOnly = searchParams.get('approvedOnly') !== 'false' // Default to true

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      productId: id,
    }

    if (approvedOnly) {
      where.isApproved = true
    }

    if (rating) {
      where.rating = rating
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: sortOrder }
        break
      case 'helpful':
        orderBy = { helpfulCount: sortOrder }
        break
      case 'createdAt':
        orderBy = { createdAt: sortOrder }
        break
    }

    // Get reviews with user information
    const [reviews, total, reviewStats] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where: { productId: id, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ])

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId: id, isApproved: true },
      _count: { rating: true },
    })

    // Calculate helpful counts
    const reviewsWithHelpful = reviews.map(review => ({
      ...review,
    }))

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewsWithHelpful,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        stats: {
          averageRating: reviewStats._avg.rating || 0,
          totalReviews: reviewStats._count.rating,
          ratingDistribution: ratingDistribution.reduce((acc, item) => {
            acc[item.rating] = item._count.rating
            return acc
          }, {} as Record<number, number>),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reviews',
        },
      },
      { status: 500 }
    )
  }
}

// POST /api/products/[id]/reviews - Create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getServerUser(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid review data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { rating, title, content, orderId } = validation.data

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: id,
        userId: user.id,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REVIEW_ALREADY_EXISTS',
            message: 'You have already reviewed this product',
          },
        },
        { status: 400 }
      )
    }

    // Verify order ownership if orderId is provided
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: user.id,
          status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] },
        },
      })

      if (!order) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ORDER',
              message: 'Order not found or not eligible for review',
            },
          },
          { status: 400 }
        )
      }
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        productId: id,
        userId: user.id,
        orderId: orderId || null,
        rating,
        title,
        content,
        isApproved: false, // Require admin approval
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review submitted successfully. It will be published after admin approval.',
    })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create review',
        },
      },
      { status: 500 }
    )
  }
}
