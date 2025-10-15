import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const moderateReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

// PUT /api/admin/reviews/[reviewId] - Moderate a review (approve/reject)
export async function PUT(
  request: NextRequest,
  _{ params }: { params: { reviewId: string } }
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

    const body = await request.json()
    const validation = moderateReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid moderation data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { action, reason } = validation.data

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: params.reviewId },
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

    // Update review based on action
    let updatedReview
    if (action === 'approve') {
      updatedReview = await prisma.review.update({
        where: { id: params.reviewId },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: session.user.id,
          rejectedAt: null,
          rejectionReason: null,
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
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnail: true,
            },
          },
        },
      })
    } else if (action === 'reject') {
      updatedReview = await prisma.review.update({
        where: { id: params.reviewId },
        data: {
          isApproved: false,
          rejectedAt: new Date(),
          rejectedBy: session.user.id,
          rejectionReason: reason || 'Review does not meet our guidelines',
          approvedAt: null,
          approvedBy: null,
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
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnail: true,
            },
          },
        },
      })
    }

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: existingReview.userId,
        type: 'REVIEW_MODERATION',
        title: action === 'approve' ? 'Review Approved' : 'Review Rejected',
        message: action === 'approve' 
          ? `Your review for "${existingReview.product.name}" has been approved and is now visible to other customers.`
          : `Your review for "${existingReview.product.name}" has been rejected. ${reason || 'It does not meet our review guidelines.'}`,
        data: {
          reviewId: params.reviewId,
          productId: existingReview.productId,
          action,
          reason,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: `Review ${action}d successfully`,
    })
  } catch (error) {
    console.error('Error moderating review:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to moderate review',
        },
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/reviews/[reviewId] - Delete a review (admin only)
export async function DELETE(
  request: NextRequest,
  _{ params }: { params: { reviewId: string } }
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

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: params.reviewId },
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

    // Delete the review
    await prisma.review.delete({
      where: { id: params.reviewId },
    })

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: existingReview.userId,
        type: 'REVIEW_DELETED',
        title: 'Review Deleted',
        message: `Your review for "${existingReview.product.name}" has been deleted by an administrator.`,
        data: {
          reviewId: params.reviewId,
          productId: existingReview.productId,
        },
      },
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
