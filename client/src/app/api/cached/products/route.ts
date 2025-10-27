import { prisma } from '@/lib/prisma'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const productsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'price', 'createdAt', 'rating']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  inStock: z.string().optional(),
  featured: z.string().optional(),
})

// GET /api/cached/products - Get products with caching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validation = productsQuerySchema.safeParse(queryParams)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const {
      page,
      limit,
      category,
      search,
      sort,
      order,
      minPrice,
      maxPrice,
      inStock,
      featured,
    } = validation.data

    // Generate cache key based on query parameters
    const cacheKey = CacheKeys.products(
      JSON.stringify({
        page,
        limit,
        category,
        search,
        sort,
        order,
        minPrice,
        maxPrice,
        inStock,
        featured,
      })
    )

    // Try to get from cache first
    const cachedData = await cacheService.get(cacheKey)
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      })
    }

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (category) {
      where.categoryId = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (inStock === 'true') {
      where.quantity = { gt: 0 }
    }

    if (featured === 'true') {
      where.isFeatured = true
    }

    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sort] = order

    // Execute query
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              reviews: {
                where: {
                  isApproved: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ])

    // Calculate average ratings
    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const avgRating = await prisma.review.aggregate({
          where: {
            productId: product.id,
            isApproved: true,
          },
          _avg: {
            rating: true,
          },
        })

        return {
          ...product,
          averageRating: avgRating._avg.rating || 0,
          reviewCount: product._count.reviews,
        }
      })
    )

    const result = {
      products: productsWithRatings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1,
      },
    }

    // Cache the result for 30 minutes
    await cacheService.set(cacheKey, result, CacheTTL.MEDIUM)

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    })
  } catch (error) {
    console.error('Error fetching cached products:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch products',
        },
      },
      { status: 500 }
    )
  }
}
