import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const helpfulVoteSchema = z.object({
  isHelpful: z.boolean(),
})

// POST /api/products/[id]/reviews/[reviewId]/helpful - Vote on review helpfulness
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
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
    const validation = helpfulVoteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid vote data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { isHelpful } = validation.data

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
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

    // Check if user already voted on this review
    const existingVote = await prisma.reviewHelpfulVote.findFirst({
      where: {
        reviewId: params.reviewId,
        userId: session.user.id,
      },
    })

    if (existingVote) {
      // Update existing vote
      const updatedVote = await prisma.reviewHelpfulVote.update({
        where: { id: existingVote.id },
        data: { isHelpful },
      })

      return NextResponse.json({
        success: true,
        data: updatedVote,
        message: 'Vote updated successfully',
      })
    } else {
      // Create new vote
      const newVote = await prisma.reviewHelpfulVote.create({
        data: {
          reviewId: params.reviewId,
          userId: session.user.id,
          isHelpful,
        },
      })

      return NextResponse.json({
        success: true,
        data: newVote,
        message: 'Vote recorded successfully',
      })
    }
  } catch (error) {
    console.error('Error voting on review:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record vote',
        },
      },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id]/reviews/[reviewId]/helpful - Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
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

    // Find and delete the vote
    const vote = await prisma.reviewHelpfulVote.findFirst({
      where: {
        reviewId: params.reviewId,
        userId: session.user.id,
      },
    })

    if (!vote) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VOTE_NOT_FOUND',
            message: 'Vote not found',
          },
        },
        { status: 404 }
      )
    }

    await prisma.reviewHelpfulVote.delete({
      where: { id: vote.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Vote removed successfully',
    })
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove vote',
        },
      },
      { status: 500 }
    )
  }
}
