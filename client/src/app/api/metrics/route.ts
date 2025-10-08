import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { metricsCollector } from '@/lib/metrics'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/metrics - Get metrics summary (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get time range from query params (default: 1 hour)
    const { searchParams } = new URL(request.url)
    const timeRange = parseInt(searchParams.get('timeRange') || '3600000')

    const summary = await metricsCollector.getSummary(timeRange)

    return NextResponse.json({
      success: true,
      data: summary,
      timeRange,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Metrics endpoint failed', { error: error.message })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch metrics',
        },
      },
      { status: 500 }
    )
  }
}
