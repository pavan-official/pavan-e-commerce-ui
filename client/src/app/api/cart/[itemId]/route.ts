import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

export async function PUT(
  request: NextRequest,
  _{ params }: { params: { itemId: string } }
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

    const { itemId } = params
    const body = await request.json()
    const validation = updateCartItemSchema.safeParse(body)

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

    const { quantity } = validation.data

    // Check if cart item exists and belongs to user
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: session.user.id,
      },
      include: {
        product: true,
        variant: true,
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CART_ITEM_NOT_FOUND',
            message: 'Cart item not found',
          },
        },
        { status: 404 }
      )
    }

    // Check stock availability
    const availableStock = existingItem.variant?.quantity || existingItem.product.quantity

    if (availableStock < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Only ${availableStock} items available`,
          },
        },
        { status: 400 }
      )
    }

    // Update cart item
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
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

    return NextResponse.json({
      success: true,
      message: 'Cart item updated successfully',
      data: updatedItem,
    })
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating cart item',
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  _{ params }: { params: { itemId: string } }
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

    const { itemId } = params

    // Check if cart item exists and belongs to user
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: session.user.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CART_ITEM_NOT_FOUND',
            message: 'Cart item not found',
          },
        },
        { status: 404 }
      )
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully',
    })
  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while removing cart item',
        },
      },
      { status: 500 }
    )
  }
}
