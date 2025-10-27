import { getServerUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const productAnalyticsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  categoryId: z.string().optional(),
})

// GET /api/analytics/products - Get product analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request)

    if (!user) {
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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validation = productAnalyticsSchema.safeParse(queryParams)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid analytics parameters',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { period, startDate, endDate, categoryId } = validation.data

    // Calculate date range
    const now = new Date()
    let dateFrom: Date
    let dateTo: Date = now

    if (startDate && endDate) {
      dateFrom = new Date(startDate)
      dateTo = new Date(endDate)
    } else {
      switch (period) {
        case 'day':
          dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
    }

    // Build where clause for orders
    const orderWhere: any = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      paymentStatus: 'COMPLETED',
    }

    // Get product sales data
    const productSales = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
        ...(categoryId && {
          product: {
            categoryId: categoryId,
          },
        }),
      },
      include: {
        product: {
          include: {
            category: true,
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
        order: {
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
    })

    // Get all products for comparison
    const allProducts = await prisma.product.findMany({
      where: {
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        _count: {
          select: {
            reviews: true,
            orderItems: {
              where: {
                order: orderWhere,
              },
            },
          },
        },
      },
    })

    // Calculate product metrics
    const productMetrics = new Map<string, {
      productId: string
      name: string
      category: string
      totalSold: number
      totalRevenue: number
      averageRating: number
      reviewCount: number
      stockLevel: number
      isActive: boolean
    }>()

    // Process sales data
    productSales.forEach((item) => {
      const key = item.product.id
      if (!productMetrics.has(key)) {
        productMetrics.set(key, {
          productId: item.product.id,
          name: item.product.name,
          category: item.product.category.name,
          totalSold: 0,
          totalRevenue: 0,
          averageRating: 0,
          reviewCount: item.product._count.reviews,
          stockLevel: item.product.quantity,
          isActive: item.product.isActive,
        })
      }

      const metrics = productMetrics.get(key)!
      metrics.totalSold += item.quantity
      metrics.totalRevenue += Number(item.price) * item.quantity
    })

    // Get average ratings
    const productRatings = await prisma.review.groupBy({
      by: ['productId'],
      where: {
        product: {
          ...(categoryId && { categoryId }),
        },
        isApproved: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    })

    // Update metrics with ratings
    productRatings.forEach((rating) => {
      const metrics = productMetrics.get(rating.productId)
      if (metrics) {
        metrics.averageRating = rating._avg.rating || 0
        metrics.reviewCount = rating._count.rating
      }
    })

    const productAnalytics = Array.from(productMetrics.values())

    // Calculate summary metrics
    const totalProducts = allProducts.length
    const activeProducts = allProducts.filter(p => p.isActive).length
    const totalRevenue = productAnalytics.reduce((sum, p) => sum + p.totalRevenue, 0)
    const totalUnitsSold = productAnalytics.reduce((sum, p) => sum + p.totalSold, 0)
    const averagePrice = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0

    // Get top performing products
    const topProducts = productAnalytics
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    // Get best selling products by quantity
    const bestSellers = productAnalytics
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10)

    // Get highest rated products
    const topRated = productAnalytics
      .filter(p => p.averageRating > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10)

    // Get low stock products
    const lowStock = allProducts
      .filter(p => p.quantity <= 10 && p.isActive)
      .map(p => ({
        productId: p.id,
        name: p.name,
        category: p.category.name,
        stock: p.quantity,
        isActive: p.isActive,
      }))

    // Get category performance
    const categoryPerformance = new Map<string, {
      categoryId: string
      name: string
      totalRevenue: number
      totalSold: number
      productCount: number
    }>()

    productAnalytics.forEach((product) => {
      const key = product.category
      if (!categoryPerformance.has(key)) {
        categoryPerformance.set(key, {
          categoryId: '',
          name: product.category,
          totalRevenue: 0,
          totalSold: 0,
          productCount: 0,
        })
      }

      const category = categoryPerformance.get(key)!
      category.totalRevenue += product.totalRevenue
      category.totalSold += product.totalSold
      category.productCount += 1
    })

    const categoryAnalytics = Array.from(categoryPerformance.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Get inventory status
    const inventoryStatus = {
      inStock: allProducts.filter(p => p.quantity > 0 && p.isActive).length,
      lowStock: allProducts.filter(p => p.quantity <= 10 && p.quantity > 0 && p.isActive).length,
      outOfStock: allProducts.filter(p => p.quantity === 0 && p.isActive).length,
      inactive: allProducts.filter(p => !p.isActive).length,
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          activeProducts,
          totalRevenue,
          totalUnitsSold,
          averagePrice,
          period: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
        },
        topPerformers: {
          byRevenue: topProducts,
          byQuantity: bestSellers,
          byRating: topRated,
        },
        categoryAnalytics,
        inventoryStatus,
        lowStockProducts: lowStock,
        insights: {
          revenueGrowth: 0, // Would need historical data to calculate
          salesGrowth: 0, // Would need historical data to calculate
          categoryTrends: [], // Would need historical data to calculate
        },
      },
    })
  } catch (error) {
    console.error('Error fetching product analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch product analytics',
        },
      },
      { status: 500 }
    )
  }
}
