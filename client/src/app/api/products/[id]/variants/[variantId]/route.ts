import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').optional(),
  sku: z.string().min(1, 'Variant SKU is required').optional(),
  price: z.number().positive('Price must be positive').optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative').optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
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

    // Get variant
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id,
      },
    })

    if (!variant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VARIANT_NOT_FOUND',
            message: 'Variant not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: variant,
    })
  } catch (error) {
    console.error('Error fetching variant:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch variant',
        },
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params
    const body = await request.json()

    // Validate input
    const validation = updateVariantSchema.safeParse(body)
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

    const data = validation.data

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
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

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id,
      },
    })

    if (!existingVariant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VARIANT_NOT_FOUND',
            message: 'Variant not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if SKU already exists (if being updated)
    if (data.sku && data.sku !== existingVariant.sku) {
      const skuExists = await prisma.productVariant.findUnique({
        where: { sku: data.sku },
      })

      if (skuExists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SKU_EXISTS',
              message: 'Variant with this SKU already exists',
            },
          },
          { status: 409 }
        )
      }
    }

    // Update variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Variant updated successfully',
      data: updatedVariant,
    })
  } catch (error) {
    console.error('Error updating variant:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the variant',
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
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

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id,
      },
    })

    if (!existingVariant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VARIANT_NOT_FOUND',
            message: 'Variant not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if variant has orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { variantId },
    })

    if (orderItems) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VARIANT_HAS_ORDERS',
            message: 'Cannot delete variant that has been ordered',
          },
        },
        { status: 409 }
      )
    }

    // Delete variant
    await prisma.productVariant.delete({
      where: { id: variantId },
    })

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the variant',
        },
      },
      { status: 500 }
    )
  }
}
