import { healthCheckService } from '@/lib/health-check'
import { NextResponse } from 'next/server'

// GET /api/health/liveness - Liveness probe for Kubernetes/Docker
export async function GET() {
  try {
    const livenessStatus = await healthCheckService.livenessCheck()
    
    if (!livenessStatus.alive) {
      return NextResponse.json(
        {
          alive: false,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      alive: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        alive: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
