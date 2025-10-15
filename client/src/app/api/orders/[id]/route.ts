import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
  trackingNumber: z.string().optional(),
  shippedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  adminNotes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  _{ params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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

    const { id } = params

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            variant: true,
          },
        },
        payments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch order',
        },
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  _{ params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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

    const { id } = params
    const body = await request.json()
    const validation = updateOrderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if order exists and belongs to user
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found',
          },
        },
        { status: 404 }
      )
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            variant: true,
          },
        },
        payments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create notification for order status change
    if (data.status && data.status !== existingOrder.status) {
      const statusMessages = {
        PENDING: 'Your order is pending confirmation',
        CONFIRMED: 'Your order has been confirmed and is being prepared',
        PROCESSING: 'Your order is being processed',
        SHIPPED: 'Your order has been shipped',
        DELIVERED: 'Your order has been delivered',
        CANCELLED: 'Your order has been cancelled',
        REFUNDED: 'Your order has been refunded',
      }

      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'ORDER_UPDATE',
          title: 'Order Status Updated',
          message: `${statusMessages[data.status]} - Order #${updatedOrder.orderNumber}`,
          data: {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            status: data.status,
            previousStatus: existingOrder.status,
            trackingNumber: data.trackingNumber,
          },
        },
      })
    }

    // Create notification for payment status change
    if (data.paymentStatus && data.paymentStatus !== existingOrder.paymentStatus) {
      const paymentMessages = {
        PENDING: 'Payment is pending',
        PROCESSING: 'Payment is being processed',
        COMPLETED: 'Payment has been completed successfully',
        FAILED: 'Payment has failed',
        CANCELLED: 'Payment has been cancelled',
        REFUNDED: 'Payment has been refunded',
      }

      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'PAYMENT_UPDATE',
          title: 'Payment Status Updated',
          message: `${paymentMessages[data.paymentStatus]} - Order #${updatedOrder.orderNumber}`,
          data: {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            paymentStatus: data.paymentStatus,
            previousPaymentStatus: existingOrder.paymentStatus,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the order',
        },
      },
      { status: 500 }
    )
  }
}
