import { getServerUser } from '@/lib/custom-auth'
import { prisma } from '@/lib/prisma'
import { getStripeInstance } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validation = createPaymentIntentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { orderId } = validation.data

    // Get order details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        user: {
          select: {
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

    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_ALREADY_COMPLETED',
            message: 'Payment already completed for this order',
          },
        },
        { status: 400 }
      )
    }

    // Create Stripe customer if not exists
    let customerId: string | null = null

    try {
      const stripe = getStripeInstance()
      const customers = await stripe.customers.list({
        email: user.email!,
        limit: 1,
      })

      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: user.name || undefined,
          metadata: {
            userId: user.id,
          },
        })
        customerId = customer.id
      }
    } catch (error) {
      console.error('Error creating/finding Stripe customer:', error)
      // Continue without customer ID
    }

    // Create payment intent
    const stripe = getStripeInstance()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100), // Convert to cents
      currency: 'usd',
      customer: customerId || undefined,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
      },
      description: `Payment for order ${order.orderNumber}`,
      shipping: order.shippingAddress ? {
        name: (order.shippingAddress as any).street,
        address: {
          line1: (order.shippingAddress as any).street,
          city: (order.shippingAddress as any).city,
          state: (order.shippingAddress as any).state,
          postal_code: (order.shippingAddress as any).zipCode,
          country: (order.shippingAddress as any).country,
        },
      } : undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currency: 'USD',
        status: 'PENDING',
        method: 'CREDIT_CARD',
        provider: 'stripe',
        providerId: paymentIntent.id,
        providerData: {
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentId: payment.id,
          amount: order.total,
          currency: 'USD',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating payment intent',
        },
      },
      { status: 500 }
    )
  }
}
