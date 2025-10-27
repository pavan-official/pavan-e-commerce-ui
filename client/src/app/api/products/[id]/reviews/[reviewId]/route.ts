import { getServerUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
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
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id, reviewId } = await params
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
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
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params
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
    const validation = updateReviewSchema.safeParse(body)

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

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: user.id,
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
      where: { id: reviewId },
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
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params
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

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: user.id,
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
      where: { id: reviewId },
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
