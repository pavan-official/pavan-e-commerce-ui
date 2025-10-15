import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
})

// GET /api/notifications/[id] - Get a specific notification
export async function GET(
  request: NextRequest,
  _{ params }: { params: { id: string } }
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

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notification',
        },
      },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/[id] - Update a notification
export async function PUT(
  request: NextRequest,
  _{ params }: { params: { id: string } }
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
    const validation = updateNotificationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingNotification) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found or you do not have permission to update it',
          },
        },
        { status: 404 }
      )
    }

    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id: params.id },
      data: validation.data,
    })

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification updated successfully',
    })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update notification',
        },
      },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  request: NextRequest,
  _{ params }: { params: { id: string } }
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

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingNotification) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found or you do not have permission to delete it',
          },
        },
        { status: 404 }
      )
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete notification',
        },
      },
      { status: 500 }
    )
  }
}
