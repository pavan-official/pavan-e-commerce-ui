import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  content: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Review too long').optional(),
})

// GET /api/products/[id]/reviews/[reviewId] - Get a specific review
export async function GET(
  request: NextRequest,
  _{ params }: { params: { id: string; reviewId: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            helpfulVotes: true,
          },
        },
      },
    })

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REVIEW_NOT_FOUND',
            message: 'Review not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...review,
        helpfulCount: review._count.helpfulVotes,
      },
    })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch review',
        },
      },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id]/reviews/[reviewId] - Update a review
export async function PUT(
  request: NextRequest,
  _{ params }: { params: { id: string; reviewId: string } }
) {
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

    const body = await request.json()
    const validation = updateReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid review data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: params.reviewId,
        userId: session.user.id,
      },
    })

    if (!existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REVIEW_NOT_FOUND',
            message: 'Review not found or you do not have permission to edit it',
          },
        },
        { status: 404 }
      )
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: params.reviewId },
      data: {
        ...validation.data,
        isApproved: false, // Reset approval status when edited
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
      data: updatedReview,
      message: 'Review updated successfully. It will be republished after admin approval.',
    })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update review',
        },
      },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id]/reviews/[reviewId] - Delete a review
export async function DELETE(
  request: NextRequest,
  _{ params }: { params: { id: string; reviewId: string } }
) {
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

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: params.reviewId,
        userId: session.user.id,
      },
    })

    if (!existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REVIEW_NOT_FOUND',
            message: 'Review not found or you do not have permission to delete it',
          },
        },
        { status: 404 }
      )
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: params.reviewId },
    })

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete review',
        },
      },
      { status: 500 }
    )
  }
}
