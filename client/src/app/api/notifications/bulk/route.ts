import { getServerUser } from '@/lib/custom-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bulkUpdateSchema = z.object({
  action: z.enum(['markAllRead', 'markAllUnread', 'deleteAll', 'deleteRead']),
  notificationIds: z.array(z.string()).optional(),
})

// PUT /api/notifications/bulk - Bulk operations on notifications
export async function PUT(request: NextRequest) {
  try {
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
    const validation = bulkUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid bulk operation data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { action, notificationIds } = validation.data

    let result
    const whereClause = {
      userId: user.id,
      ...(notificationIds && { id: { in: notificationIds } }),
    }

    switch (action) {
      case 'markAllRead':
        result = await prisma.notification.updateMany({
          where: whereClause,
          data: { isRead: true },
        })
        break

      case 'markAllUnread':
        result = await prisma.notification.updateMany({
          where: whereClause,
          data: { isRead: false },
        })
        break

      case 'deleteAll':
        result = await prisma.notification.deleteMany({
          where: whereClause,
        })
        break

      case 'deleteRead':
        result = await prisma.notification.deleteMany({
          where: {
            ...whereClause,
            isRead: true,
          },
        })
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid bulk action',
            },
          },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        affectedCount: result.count,
      },
      message: `Bulk operation completed successfully`,
    })
  } catch (error) {
    console.error('Error performing bulk notification operation:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to perform bulk operation',
        },
      },
      { status: 500 }
    )
  }
}
