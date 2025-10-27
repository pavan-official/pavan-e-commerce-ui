import { getServerUser } from '@/lib/custom-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const user = await getServerUser(request)

    if (!user?.id) {
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

    const { paymentId } = await params

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: {
          userId: user.id,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payment,
    })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch payment',
        },
      },
      { status: 500 }
    )
  }
}
