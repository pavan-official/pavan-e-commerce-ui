import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint for Docker/Kubernetes
 * 
 * Purpose: Verify application and dependencies are healthy
 * Used by: Docker HEALTHCHECK, Kubernetes liveness/readiness probes
 * 
 * Interview Note: Essential for:
 * - Zero-downtime deployments
 * - Auto-healing in Kubernetes
 * - Load balancer health checks
 * - Monitoring and alerting
 */

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database connectivity
    // Why: Most critical dependency for our application
    // Timeout: Fail fast if DB is slow/down
    const dbHealthPromise = prisma.$queryRaw`SELECT 1`
    const dbHealthTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    )

    await Promise.race([dbHealthPromise, dbHealthTimeout])

    // Calculate response time
    const responseTime = Date.now() - startTime

    // Return health status
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        checks: {
          database: 'connected',
          server: 'running',
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 200 }
    )
  } catch (error) {
    // Health check failed
    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        checks: {
          database: 'disconnected',
          server: 'running',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 } // Service Unavailable
    )
  }
}

/**
 * Interview Talking Points:
 * 
 * Q: What's the difference between liveness and readiness probes?
 * A: 
 * - Liveness: Is the app alive? (restart if fails)
 * - Readiness: Can the app serve traffic? (remove from load balancer if fails)
 * - This endpoint can be used for both
 * 
 * Q: Why check database in health check?
 * A: Database is a critical dependency. If DB is down:
 * - App can't serve requests properly
 * - Better to fail health check and be replaced
 * - Prevents cascading failures
 * 
 * Q: Why use a timeout?
 * A: Prevents hanging health checks:
 * - Kubernetes needs quick responses (typically <3s)
 * - Slow responses indicate system issues
 * - Fail fast is better than hanging
 * 
 * Q: What status codes should health checks return?
 * A:
 * - 200: Healthy
 * - 503: Unhealthy (Service Unavailable)
 * - Some use 429 for degraded state
 */