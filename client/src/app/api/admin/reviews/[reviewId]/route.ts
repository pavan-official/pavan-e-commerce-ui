import { getServerUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const moderateReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

// PUT /api/admin/reviews/[reviewId] - Moderate a review (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
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

    const body = await request.json()
    const validation = moderateReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid moderation data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { action, reason } = validation.data

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existingReview) {
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

    // Update review status
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isApproved: action === 'approve',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        review: updatedReview,
        action,
        reason,
      },
    })
  } catch (error) {
    console.error('Error moderating review:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to moderate review',
        },
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/reviews/[reviewId] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
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

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!existingReview) {
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
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete review',
        },
      },
      { status: 500 }
    )
  }
}