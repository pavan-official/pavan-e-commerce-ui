import { healthCheckService } from '@/lib/health-check'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'

// GET /api/health/readiness - Readiness probe for Kubernetes/Docker
export async function GET() {
  try {
    const readinessStatus = await healthCheckService.readinessCheck()
    
    if (!readinessStatus.ready) {
      logger.warn('Readiness check failed', { reason: readinessStatus.reason })
      
      return NextResponse.json(
        {
          ready: false,
          reason: readinessStatus.reason,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      ready: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Readiness check endpoint failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    
    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
