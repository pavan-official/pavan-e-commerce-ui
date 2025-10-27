import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'Variant SKU is required'),
  price: z.number().positive('Price must be positive').optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative').default(0),
  attributes: z.record(z.string(), z.any()).default({}),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
})

const updateVariantSchema = createVariantSchema.partial()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Get variants
    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: variants,
    })
  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch variants',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validation = createVariantSchema.safeParse(body)
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

    // Check if variant SKU already exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { sku: data.sku },
    })

    if (existingVariant) {
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

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        name: data.name,
        sku: data.sku,
        price: data.price,
        quantity: data.quantity,
        attributes: data.attributes,
        image: data.image,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Variant created successfully',
        data: variant,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating variant:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the variant',
        },
      },
      { status: 500 }
    )
  }
}
