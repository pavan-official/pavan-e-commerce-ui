import { getServerUser } from '@/lib/custom-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createNotificationSchema = z.object({
  type: z.enum(['ORDER_UPDATE', 'PAYMENT_SUCCESS', 'SHIPMENT_UPDATE', 'REVIEW_REQUEST', 'PROMOTION', 'SYSTEM']),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  data: z.record(z.string(), z.any()).optional(),
  userId: z.string().optional(), // If not provided, will be set from session
})

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const type = searchParams.get('type') || undefined
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: user.id,
    }

    if (type) {
      where.type = type
    }

    if (unreadOnly) {
      where.isRead = false
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }
    switch (sortBy) {
      case 'createdAt':
        orderBy = { createdAt: sortOrder }
        break
      case 'isRead':
        orderBy = { isRead: sortOrder }
        break
      case 'type':
        orderBy = { type: sortOrder }
        break
    }

    // Get notifications
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        unreadCount,
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notifications',
        },
      },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
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
    const validation = createNotificationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { type, title, message, data, userId } = validation.data

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId: userId || user.id,
        type,
        title,
        message,
        data: data || {},
        isRead: false,
      },
    })

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully',
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create notification',
        },
      },
      { status: 500 }
    )
  }
}
