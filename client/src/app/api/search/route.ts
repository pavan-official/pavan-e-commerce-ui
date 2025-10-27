import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().optional(), // Search query
  category: z.string().optional(), // Category filter
  minPrice: z.number().min(0).optional(), // Minimum price
  maxPrice: z.number().min(0).optional(), // Maximum price
  inStock: z.boolean().optional(), // Stock availability
  isFeatured: z.boolean().optional(), // Featured products
  rating: z.number().min(1).max(5).optional(), // Minimum rating
  sortBy: z.enum(['name', 'price', 'rating', 'createdAt', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate search parameters
    const params = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
    }

    const validation = searchSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      rating,
      sortBy,
      sortOrder,
      page,
      limit,
    } = validation.data

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true, // Only show active products
    }

    // Text search
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (category) {
      where.category = {
        OR: [
          { slug: category },
          { name: { contains: category, mode: 'insensitive' } },
        ],
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) {
        where.price.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice
      }
    }

    // Stock filter
    if (inStock !== undefined) {
      if (inStock) {
        where.quantity = { gt: 0 }
      } else {
        where.quantity = { lte: 0 }
      }
    }

    // Featured filter
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured
    }

    // Rating filter
    if (rating !== undefined) {
      where.reviews = {
        some: {
          rating: { gte: rating },
          isApproved: true,
        },
      }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' } // Default sorting

    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder }
        break
      case 'price':
        orderBy = { price: sortOrder }
        break
      case 'rating':
        orderBy = {
          reviews: {
            _count: sortOrder,
          },
        }
        break
      case 'createdAt':
        orderBy = { createdAt: sortOrder }
        break
      case 'popularity':
        orderBy = {
          orderItems: {
            _count: sortOrder,
          },
        }
        break
    }

    // Execute search with aggregations
    const [products, total, aggregations] = await Promise.all([
      // Main search results
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          variants: true,
          reviews: {
            where: { isApproved: true },
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        orderBy,
      }),

      // Total count
      prisma.product.count({ where }),

      // Aggregations for filters
      prisma.product.aggregate({
        where: {
          ...where,
          // Remove text search for aggregations
          OR: undefined,
        },
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
      }),
    ])

    // Calculate average ratings
    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const avgRating = await prisma.review.aggregate({
          where: {
            productId: product.id,
            isApproved: true,
          },
          _avg: { rating: true },
        })

        return {
          ...product,
          averageRating: avgRating._avg.rating || 0,
          reviewCount: product._count.reviews,
        }
      })
    )

    // Get category aggregations
    const categoryAggregations = await prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        ...where,
        OR: undefined, // Remove text search for category aggregations
      },
      _count: { categoryId: true },
    })

    const categoriesWithCounts = await Promise.all(
      categoryAggregations.map(async (agg) => {
        const category = await prisma.category.findUnique({
          where: { id: agg.categoryId },
          select: { id: true, name: true, slug: true },
        })
        return {
          ...category,
          count: agg._count.categoryId,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithRatings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        aggregations: {
          price: {
            min: aggregations._min.price || 0,
            max: aggregations._max.price || 0,
            avg: aggregations._avg.price || 0,
          },
          categories: categoriesWithCounts,
        },
        filters: {
          applied: {
            q,
            category,
            minPrice,
            maxPrice,
            inStock,
            isFeatured,
            rating,
            sortBy,
            sortOrder,
          },
        },
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during search',
        },
      },
      { status: 500 }
    )
  }
}
