import { healthCheckService } from '@/lib/health-check'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'

// GET /api/health - Comprehensive health check
export async function GET() {
  try {
    const healthStatus = await healthCheckService.check()
    
    const statusCode = healthStatus.status === 'healthy' ? 200 
      : healthStatus.status === 'degraded' ? 200 
      : 503

    return NextResponse.json(healthStatus, { status: statusCode })
  } catch (error) {
    logger.error('Health check endpoint failed', { error: error.message })
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        error: error.message,
      },
      { status: 503 }
    )
  }
}
