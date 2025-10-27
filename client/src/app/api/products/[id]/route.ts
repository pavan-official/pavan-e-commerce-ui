import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  slug: z.string().min(1, 'Product slug is required').optional(),
  description: z.string().min(1, 'Product description is required').optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  sku: z.string().min(1, 'SKU is required').optional(),
  barcode: z.string().optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative').optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  images: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  weight: z.number().positive().optional(),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        reviews: {
          include: { 
            user: { 
              select: { 
                name: true, 
                avatar: true 
              } 
            } 
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { reviews: true } }
      }
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred'
        }
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validation = updateProductSchema.safeParse(body)
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
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
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

    // Check if SKU already exists (if being updated)
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      })

      if (skuExists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SKU_EXISTS',
              message: 'Product with this SKU already exists',
            },
          },
          { status: 409 }
        )
      }
    }

    // Check if slug already exists (if being updated)
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: data.slug },
      })

      if (slugExists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SLUG_EXISTS',
              message: 'Product with this slug already exists',
            },
          },
          { status: 409 }
        )
      }
    }

    // Verify category exists (if being updated)
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      })

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CATEGORY_NOT_FOUND',
              message: 'Category not found',
            },
          },
          { status: 404 }
        )
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        variants: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the product',
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
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

    // Check if product has orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: id },
    })

    if (orderItems) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_HAS_ORDERS',
            message: 'Cannot delete product that has been ordered',
          },
        },
        { status: 409 }
      )
    }

    // Delete product (cascades to variants, cart items, wishlist items, etc.)
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the product',
        },
      },
      { status: 500 }
    )
  }
}
