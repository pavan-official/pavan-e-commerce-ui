import { getServerUser } from '@/lib/custom-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
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

    const { itemId } = await params

    // Check if wishlist item exists and belongs to user
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        userId: user.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WISHLIST_ITEM_NOT_FOUND',
            message: 'Wishlist item not found',
          },
        },
        { status: 404 }
      )
    }

    // Delete wishlist item
    await prisma.wishlistItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({
      success: true,
      message: 'Item removed from wishlist successfully',
    })
  } catch (error) {
    console.error('Error removing wishlist item:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while removing wishlist item',
        },
      },
      { status: 500 }
    )
  }
}
