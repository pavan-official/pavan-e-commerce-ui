import { getTokenFromRequest, verifyJWTToken } from '@/lib/custom-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
})

export async function GET(request: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(request)
    
    if (!token) {
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

    // Verify JWT token
    const user = verifyJWTToken(token)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      )
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: true,
            variants: true,
          },
        },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.variant?.price || item.product.price)
      return sum + (price * item.quantity)
    }, 0)

    const tax = subtotal * 0.08 // 8% tax rate
    const total = subtotal + tax

    // Convert Prisma Decimal types to numbers for all prices
    const serializedItems = cartItems.map(item => ({
      ...item,
      product: {
        ...item.product,
        price: Number(item.product.price),
      },
      variant: item.variant ? {
        ...item.variant,
        price: item.variant.price ? Number(item.variant.price) : null,
      } : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        items: serializedItems,
        summary: {
          subtotal: Number(subtotal.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          total: Number(total.toFixed(2)),
          itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch cart',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(request)
    
    if (!token) {
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

    // Verify JWT token
    const user = verifyJWTToken(token)
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = addToCartSchema.safeParse(body)

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

    const { productId, variantId, quantity } = validation.data

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      )
    }

    // Verify variant exists if provided
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId: productId,
        },
      })

      if (!variant) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VARIANT_NOT_FOUND',
              message: 'Product variant not found',
            },
          },
          { status: 404 }
        )
      }

      // Check variant stock
      if (variant.quantity < quantity) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Only ${variant.quantity} items available`,
            },
          },
          { status: 400 }
        )
      }
    } else {
      // Check product stock
      if (product.quantity < quantity) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Only ${product.quantity} items available`,
            },
          },
          { status: 400 }
        )
      }
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId,
        variantId: variantId || null,
      },
    })

    let cartItem

    if (existingItem) {
      // Update existing item quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            include: {
              category: true,
              variants: true,
            },
          },
          variant: true,
        },
      })
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
        include: {
          product: {
            include: {
              category: true,
              variants: true,
            },
          },
          variant: true,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Item added to cart successfully',
        data: cartItem,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding to cart:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while adding item to cart',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
      },
      { status: 500 }
    )
  }
}
