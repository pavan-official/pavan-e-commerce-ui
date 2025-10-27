import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { cacheService } from '@/lib/redis'

// Health check status
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: ComponentHealth
    redis: ComponentHealth
    memory: ComponentHealth
    disk: ComponentHealth
  }
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  message?: string
  details?: Record<string, unknown>
}

export class HealthCheckService {
  private static instance: HealthCheckService
  private startTime: number

  private constructor() {
    this.startTime = Date.now()
  }

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService()
    }
    return HealthCheckService.instance
  }

  // Perform comprehensive health check
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const [database, redis, memory, disk] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkMemory(),
        this.checkDisk(),
      ])

      const checks = {
        database: database.status === 'fulfilled' ? database.value : this.createUnhealthyResult('Database check failed'),
        redis: redis.status === 'fulfilled' ? redis.value : this.createUnhealthyResult('Redis check failed'),
        memory: memory.status === 'fulfilled' ? memory.value : this.createUnhealthyResult('Memory check failed'),
        disk: disk.status === 'fulfilled' ? disk.value : this.createUnhealthyResult('Disk check failed'),
      }

      const overallStatus = this.determineOverallStatus(checks)
      const duration = Date.now() - startTime

      logger.info(`Health check completed in ${duration}ms`, {
        status: overallStatus,
        checks: Object.entries(checks).map(([name, check]) => ({
          name,
          status: check.status,
        })),
      })

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks,
      }
    } catch (error) {
      logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: this.createUnhealthyResult('Check failed'),
          redis: this.createUnhealthyResult('Check failed'),
          memory: this.createUnhealthyResult('Check failed'),
          disk: this.createUnhealthyResult('Check failed'),
        },
      }
    }
  }

  // Check database health
  async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now()

    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1 as test`
      
      // Get connection pool info
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count FROM pg_stat_activity
      `
      
      const responseTime = Date.now() - startTime
      const activeConnections = Number(result[0].count)

      // Check if response time is acceptable
      if (responseTime > 1000) {
        return {
          status: 'degraded',
          responseTime,
          message: 'Database response time is high',
          details: {
            activeConnections,
            threshold: '1000ms',
          },
        }
      }

      return {
        status: 'healthy',
        responseTime,
        message: 'Database is operational',
        details: {
          activeConnections,
        },
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      logger.error('Database health check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
      
      return {
        status: 'unhealthy',
        responseTime,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Check Redis health
  async checkRedis(): Promise<ComponentHealth> {
    const startTime = Date.now()

    try {
      // Test Redis connection with a simple operation
      const testKey = 'health:check:' + Date.now()
      await cacheService.set(testKey, 'test', 5)
      const value = await cacheService.get(testKey)
      await cacheService.del(testKey)

      const responseTime = Date.now() - startTime

      if (value !== 'test') {
        return {
          status: 'unhealthy',
          responseTime,
          message: 'Redis read/write test failed',
        }
      }

      // Check if response time is acceptable
      if (responseTime > 500) {
        return {
          status: 'degraded',
          responseTime,
          message: 'Redis response time is high',
          details: {
            threshold: '500ms',
          },
        }
      }

      return {
        status: 'healthy',
        responseTime,
        message: 'Redis is operational',
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      logger.error('Redis health check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
      
      return {
        status: 'unhealthy',
        responseTime,
        message: `Redis error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Check memory usage
  async checkMemory(): Promise<ComponentHealth> {
    try {
      const memoryUsage = process.memoryUsage()
      const totalMemory = memoryUsage.heapTotal
      const usedMemory = memoryUsage.heapUsed
      const memoryPercentage = (usedMemory / totalMemory) * 100

      // Memory thresholds
      const degradedThreshold = 80
      const unhealthyThreshold = 90

      if (memoryPercentage > unhealthyThreshold) {
        return {
          status: 'unhealthy',
          message: 'Memory usage is critical',
          details: {
            usedMemory: `${Math.round(usedMemory / 1024 / 1024)}MB`,
            totalMemory: `${Math.round(totalMemory / 1024 / 1024)}MB`,
            percentage: `${memoryPercentage.toFixed(2)}%`,
            threshold: `${unhealthyThreshold}%`,
          },
        }
      }

      if (memoryPercentage > degradedThreshold) {
        return {
          status: 'degraded',
          message: 'Memory usage is high',
          details: {
            usedMemory: `${Math.round(usedMemory / 1024 / 1024)}MB`,
            totalMemory: `${Math.round(totalMemory / 1024 / 1024)}MB`,
            percentage: `${memoryPercentage.toFixed(2)}%`,
            threshold: `${degradedThreshold}%`,
          },
        }
      }

      return {
        status: 'healthy',
        message: 'Memory usage is normal',
        details: {
          usedMemory: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          totalMemory: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          percentage: `${memoryPercentage.toFixed(2)}%`,
        },
      }
    } catch (error) {
      logger.error('Memory health check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
      
      return {
        status: 'unhealthy',
        message: `Memory check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Check disk usage (simplified for demo)
  async checkDisk(): Promise<ComponentHealth> {
    try {
      // In a real implementation, you would check actual disk usage
      // For now, we'll return a healthy status
      return {
        status: 'healthy',
        message: 'Disk space is adequate',
        details: {
          note: 'Disk monitoring not fully implemented',
        },
      }
    } catch (error) {
      logger.error('Disk health check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
      
      return {
        status: 'unhealthy',
        message: `Disk check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Readiness check (can accept traffic)
  async readinessCheck(): Promise<{ ready: boolean; reason?: string }> {
    try {
      // Check critical dependencies
      const [dbCheck, redisCheck] = await Promise.all([
        this.checkDatabase(),
        this.checkRedis(),
      ])

      if (dbCheck.status === 'unhealthy') {
        return { ready: false, reason: 'Database is unhealthy' }
      }

      if (redisCheck.status === 'unhealthy') {
        return { ready: false, reason: 'Redis is unhealthy' }
      }

      return { ready: true }
    } catch (error) {
      return { ready: false, reason: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Liveness check (process is alive)
  async livenessCheck(): Promise<{ alive: boolean }> {
    // Simple check to ensure the process is responsive
    return { alive: true }
  }

  // Get application uptime
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  // Determine overall health status
  private determineOverallStatus(
    checks: Record<string, ComponentHealth>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map(check => check.status)

    if (statuses.some(status => status === 'unhealthy')) {
      return 'unhealthy'
    }

    if (statuses.some(status => status === 'degraded')) {
      return 'degraded'
    }

    return 'healthy'
  }

  // Create unhealthy result
  private createUnhealthyResult(message: string): ComponentHealth {
    return {
      status: 'unhealthy',
      message,
    }
  }
}

export const healthCheckService = HealthCheckService.getInstance()
export default healthCheckService
