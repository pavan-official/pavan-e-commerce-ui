import { getServerUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const salesAnalyticsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

// GET /api/analytics/sales - Get sales analytics data
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

    const validation = salesAnalyticsSchema.safeParse(queryParams)

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

    const { period, startDate, endDate, groupBy } = validation.data

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

    // Get sales data
    const salesData = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
        paymentStatus: 'COMPLETED',
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        status: true,
        items: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate metrics
    const totalRevenue = salesData.reduce((sum, order) => sum + order.total.toNumber(), 0)
    const totalOrders = salesData.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Group sales by time period
    const salesByPeriod = new Map<string, { revenue: number; orders: number; date: string }>()

    salesData.forEach((order) => {
      let key: string
      const orderDate = new Date(order.createdAt)

      switch (groupBy) {
        case 'day':
          key = orderDate.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(orderDate)
          weekStart.setDate(orderDate.getDate() - orderDate.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = orderDate.toISOString().split('T')[0]
      }

      if (!salesByPeriod.has(key)) {
        salesByPeriod.set(key, { revenue: 0, orders: 0, date: key })
      }

      const periodData = salesByPeriod.get(key)!
      periodData.revenue += order.total.toNumber()
      periodData.orders += 1
    })

    // Convert to array and sort
    const salesChartData = Array.from(salesByPeriod.values()).sort((a, b) => a.date.localeCompare(b.date))

    // Get top selling products
    const productSales = new Map<string, { productId: string; name: string; category: string; quantity: number; revenue: number }>()

    salesData.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.product.id
        if (!productSales.has(key)) {
          productSales.set(key, {
            productId: item.product.id,
            name: item.product.name,
            category: item.product.category.name,
            quantity: 0,
            revenue: 0,
          })
        }

        const productData = productSales.get(key)!
        productData.quantity += item.quantity
        productData.revenue += Number(item.price) * item.quantity
      })
    })

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Get sales by category
    const categorySales = new Map<string, { categoryId: string; name: string; revenue: number; orders: number }>()

    salesData.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.product.category.id
        if (!categorySales.has(key)) {
          categorySales.set(key, {
            categoryId: item.product.category.id,
            name: item.product.category.name,
            revenue: 0,
            orders: 0,
          })
        }

        const categoryData = categorySales.get(key)!
        categoryData.revenue += Number(item.price) * item.quantity
        categoryData.orders += 1
      })
    })

    const salesByCategory = Array.from(categorySales.values())
      .sort((a, b) => b.revenue - a.revenue)

    // Get order status distribution
    const orderStatusCounts = salesData.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          period: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
        },
        chartData: {
          salesByPeriod: salesChartData,
          salesByCategory,
          orderStatusDistribution: orderStatusCounts,
        },
        topProducts,
        metrics: {
          revenueGrowth: 0, // Would need historical data to calculate
          orderGrowth: 0, // Would need historical data to calculate
          conversionRate: 0, // Would need visitor data to calculate
        },
      },
    })
  } catch (error) {
    console.error('Error fetching sales analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch sales analytics',
        },
      },
      { status: 500 }
    )
  }
}
