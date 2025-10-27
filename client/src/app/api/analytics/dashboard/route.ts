import { getServerUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/analytics/dashboard - Get dashboard overview data
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

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get key metrics in parallel
    const [
      totalRevenue,
      todayRevenue,
      yesterdayRevenue,
      lastWeekRevenue,
      lastMonthRevenue,
      totalOrders,
      todayOrders,
      yesterdayOrders,
      lastWeekOrders,
      lastMonthOrders,
      totalUsers,
      todayUsers,
      yesterdayUsers,
      lastWeekUsers,
      lastMonthUsers,
      totalProducts,
      activeProducts,
      lowStockProducts,
      pendingOrders,
      completedOrders,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Revenue metrics
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: { gte: yesterday, lt: today },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: { gte: lastWeek },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: { gte: lastMonth },
        },
        _sum: { total: true },
      }),

      // Order metrics
      prisma.order.count(),
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: lastWeek } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: lastMonth } },
      }),

      // User metrics
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: lastWeek } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: lastMonth } },
      }),

      // Product metrics
      prisma.product.count(),
      prisma.product.count({
        where: { isActive: true },
      }),
      prisma.product.count({
        where: { quantity: { lte: 10 }, isActive: true },
      }),

      // Order status metrics
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
      prisma.order.count({
        where: { status: 'DELIVERED' },
      }),

      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            take: 1,
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      // Top products by revenue
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            paymentStatus: 'COMPLETED',
            createdAt: { gte: lastMonth },
          },
        },
        _sum: {
          price: true,
        },
        _count: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            price: 'desc',
          },
        },
        take: 5,
      }),
    ])

    // Get product details for top products
    const topProductIds = topProducts.map(p => p.productId)
    const topProductDetails = await prisma.product.findMany({
      where: {
        id: { in: topProductIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
        thumbnail: true,
      },
    })

    // Combine top products with details
    const topProductsWithDetails = topProducts.map(product => {
      const details = topProductDetails.find(d => d.id === product.productId)
      return {
        productId: product.productId,
        name: details?.name || 'Unknown Product',
        price: details?.price || 0,
        thumbnail: details?.thumbnail,
        revenue: product._sum.price || 0,
        quantitySold: product._count.quantity || 0,
      }
    })

    // Calculate growth percentages
    const revenueGrowth = yesterdayRevenue._sum.total && todayRevenue._sum.total
      ? ((todayRevenue._sum.total.toNumber() - yesterdayRevenue._sum.total.toNumber()) / yesterdayRevenue._sum.total.toNumber()) * 100
      : 0

    const orderGrowth = yesterdayOrders && todayOrders
      ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100
      : 0

    const userGrowth = yesterdayUsers && todayUsers
      ? ((todayUsers - yesterdayUsers) / yesterdayUsers) * 100
      : 0

    // Calculate conversion rate (simplified)
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 && totalRevenue._sum.total
      ? totalRevenue._sum.total.toNumber() / totalOrders
      : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue: totalRevenue._sum.total?.toNumber() || 0,
          totalOrders,
          totalUsers,
          totalProducts,
          activeProducts,
          conversionRate,
          averageOrderValue,
        },
        today: {
          revenue: todayRevenue._sum.total?.toNumber() || 0,
          orders: todayOrders,
          users: todayUsers,
          revenueGrowth,
          orderGrowth,
          userGrowth,
        },
        thisWeek: {
          revenue: lastWeekRevenue._sum.total?.toNumber() || 0,
          orders: lastWeekOrders,
          users: lastWeekUsers,
        },
        thisMonth: {
          revenue: lastMonthRevenue._sum.total?.toNumber() || 0,
          orders: lastMonthOrders,
          users: lastMonthUsers,
        },
        status: {
          pendingOrders,
          completedOrders,
          lowStockProducts,
        },
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total.toNumber(),
          status: order.status,
          createdAt: order.createdAt,
          user: order.user,
          firstItem: order.items[0]?.product.name || 'Multiple items',
        })),
        topProducts: topProductsWithDetails,
        quickStats: {
          revenueGrowth,
          orderGrowth,
          userGrowth,
          conversionRate,
          averageOrderValue,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard analytics',
        },
      },
      { status: 500 }
    )
  }
}
