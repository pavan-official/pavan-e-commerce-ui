import { getServerUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const userAnalyticsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// GET /api/analytics/users - Get user analytics data
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

    const validation = userAnalyticsSchema.safeParse(queryParams)

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

    const { period, startDate, endDate } = validation.data

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

    // Get user registration data
    const userRegistrations = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        id: true,
        createdAt: true,
        role: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get user activity data
    const userActivity = await prisma.user.findMany({
      where: {
        OR: [
          {
            orders: {
              some: {
                createdAt: {
                  gte: dateFrom,
                  lte: dateTo,
                },
              },
            },
          },
          {
            reviews: {
              some: {
                createdAt: {
                  gte: dateFrom,
                  lte: dateTo,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        role: true,
        orders: {
          where: {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          },
        },
        reviews: {
          where: {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          select: {
            id: true,
            rating: true,
            createdAt: true,
          },
        },
      },
    })

    // Calculate metrics
    const totalUsers = await prisma.user.count()
    const newUsers = userRegistrations.length
    const activeUsers = userActivity.length
    const adminUsers = userRegistrations.filter(user => user.role === 'ADMIN').length
    const regularUsers = userRegistrations.filter(user => user.role === 'USER').length

    // Calculate user engagement metrics
    const usersWithOrders = userActivity.filter(user => user.orders.length > 0).length
    const usersWithReviews = userActivity.filter(user => user.reviews.length > 0).length
    const averageOrdersPerUser = userActivity.length > 0 
      ? userActivity.reduce((sum, user) => sum + user.orders.length, 0) / userActivity.length 
      : 0
    const averageReviewsPerUser = userActivity.length > 0 
      ? userActivity.reduce((sum, user) => sum + user.reviews.length, 0) / userActivity.length 
      : 0

    // Group registrations by day
    const registrationsByDay = new Map<string, number>()
    userRegistrations.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0]
      registrationsByDay.set(date, (registrationsByDay.get(date) || 0) + 1)
    })

    const registrationChartData = Array.from(registrationsByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get top customers by order value
    const customerSpending = userActivity
      .map(user => ({
        userId: user.id,
        totalSpent: user.orders.reduce((sum, order) => sum + order.total.toNumber(), 0),
        orderCount: user.orders.length,
        averageOrderValue: user.orders.length > 0 
          ? user.orders.reduce((sum, order) => sum + order.total.toNumber(), 0) / user.orders.length 
          : 0,
      }))
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // Get user role distribution
    const roleDistribution = {
      USER: regularUsers,
      ADMIN: adminUsers,
    }

    // Get user engagement levels
    const engagementLevels = {
      high: userActivity.filter(user => user.orders.length >= 5 || user.reviews.length >= 3).length,
      medium: userActivity.filter(user => (user.orders.length >= 2 && user.orders.length < 5) || (user.reviews.length >= 1 && user.reviews.length < 3)).length,
      low: userActivity.filter(user => user.orders.length < 2 && user.reviews.length < 1).length,
    }

    // Calculate retention metrics (simplified)
    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          newUsers,
          activeUsers,
          retentionRate,
          period: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
        },
        metrics: {
          averageOrdersPerUser,
          averageReviewsPerUser,
          usersWithOrders,
          usersWithReviews,
          engagementLevels,
        },
        chartData: {
          registrationsByDay: registrationChartData,
          roleDistribution,
          engagementLevels,
        },
        topCustomers: customerSpending,
        insights: {
          userGrowth: 0, // Would need historical data to calculate
          engagementTrend: 0, // Would need historical data to calculate
          churnRate: 0, // Would need historical data to calculate
        },
      },
    })
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user analytics',
        },
      },
      { status: 500 }
    )
  }
}
