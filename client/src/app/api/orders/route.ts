import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createOrderSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  billingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: ApiResponse = { userId: session.user.id }
    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch orders',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validation = createOrderSchema.safeParse(body)

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

    const { shippingAddress, billingAddress, paymentMethod, shippingMethod, notes } = validation.data

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: true,
        variant: true,
      },
    })

    if (cartItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_CART',
            message: 'Cart is empty',
          },
        },
        { status: 400 }
      )
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = []

    for (const cartItem of cartItems) {
      const price = cartItem.variant?.price || cartItem.product.price
      const itemTotal = price * cartItem.quantity
      subtotal += itemTotal

      // Check stock availability
      const availableStock = cartItem.variant?.quantity || cartItem.product.quantity
      if (availableStock < cartItem.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Insufficient stock for ${cartItem.product.name}`,
            },
          },
          { status: 400 }
        )
      }

      orderItems.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        price,
      })
    }

    const tax = subtotal * 0.08 // 8% tax
    const shipping = shippingMethod === 'express' ? 15.99 : 9.99
    const total = subtotal + tax + shipping

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: 'PENDING',
          subtotal,
          tax,
          shipping,
          discount: 0,
          total,
          shippingAddress,
          billingAddress,
          paymentStatus: 'PENDING',
          paymentMethod,
          shippingMethod: shippingMethod || 'standard',
          notes,
        },
      })

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
      })

      // Update stock
      for (const cartItem of cartItems) {
        if (cartItem.variantId) {
          await tx.productVariant.update({
            where: { id: cartItem.variantId },
            data: { quantity: { decrement: cartItem.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: cartItem.productId },
            data: { quantity: { decrement: cartItem.quantity } },
          })
        }
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      })

      return newOrder
    })

    // Fetch complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
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
      },
    })

    // Create notification for order creation
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'ORDER_UPDATE',
        title: 'Order Created Successfully',
        message: `Your order #${orderNumber} has been created and is being processed.`,
        data: {
          orderId: order.id,
          orderNumber,
          status: 'PENDING',
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        data: completeOrder,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the order',
        },
      },
      { status: 500 }
    )
  }
}
