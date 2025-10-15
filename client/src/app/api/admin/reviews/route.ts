import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/reviews - Get all reviews for moderation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const status = searchParams.get('status') || 'pending' // pending, approved, rejected
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: ApiResponse = {}
    if (status === 'pending') {
      where.isApproved = false
    } else if (status === 'approved') {
      where.isApproved = true
    } else if (status === 'rejected') {
      where.isApproved = false
      where.rejectedAt = { not: null }
    }

    // Build orderBy clause
    let orderBy: ApiResponse = { createdAt: 'desc' }
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: sortOrder }
        break
      case 'createdAt':
        orderBy = { createdAt: sortOrder }
        break
      case 'updatedAt':
        orderBy = { updatedAt: sortOrder }
        break
    }

    // Get reviews with user and product information
    const [reviews, total] = await Promise.all([
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
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnail: true,
            },
          },
          _count: {
            select: {
              helpfulVotes: true,
            },
          },
        },
        orderBy,
      }),
      prisma.review.count({ where }),
    ])

    // Get moderation statistics
    const stats = await prisma.review.aggregate({
      _count: {
        id: true,
      },
    })

    const pendingCount = await prisma.review.count({
      where: { isApproved: false, rejectedAt: null },
    })

    const approvedCount = await prisma.review.count({
      where: { isApproved: true },
    })

    const rejectedCount = await prisma.review.count({
      where: { isApproved: false, rejectedAt: { not: null } },
    })

    // Calculate helpful counts
    const reviewsWithHelpful = reviews.map(review => ({
      ...review,
      helpfulCount: review._count.helpfulVotes,
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
          total: stats._count.id,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching reviews for moderation:', error)
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
