import { logger } from '@/lib/logger'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/redis'

// Metric types
export interface Metric {
  name: string
  value: number
  unit: string
  timestamp: number
  tags?: Record<string, string>
}

export interface MetricsSummary {
  requests: {
    total: number
    perSecond: number
    byMethod: Record<string, number>
    byStatus: Record<string, number>
  }
  performance: {
    averageResponseTime: number
    p50: number
    p95: number
    p99: number
  }
  errors: {
    total: number
    rate: number
    byType: Record<string, number>
  }
  business: {
    activeUsers: number
    ordersCreated: number
    revenue: number
  }
}

export class MetricsCollector {
  private static instance: MetricsCollector
  private metricsBuffer: Metric[] = []
  private bufferSize = 1000
  private flushInterval = 300000 // 5 minutes

  private constructor() {
    // Start periodic flush
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  // Record a metric
  record(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    }

    this.metricsBuffer.push(metric)

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flush()
    }
  }

  // Record HTTP request metric
  recordRequest(method: string, path: string, statusCode: number, duration: number): void {
    this.record('http_request_total', 1, 'count', {
      method,
      path,
      status: statusCode.toString(),
    })

    this.record('http_request_duration', duration, 'ms', {
      method,
      path,
    })
  }

  // Record error metric
  recordError(type: string, message: string): void {
    this.record('error_total', 1, 'count', {
      type,
      message: message.substring(0, 100),
    })
  }

  // Record business metric
  recordBusiness(metric: string, value: number, unit: string = 'count'): void {
    this.record(`business_${metric}`, value, unit)
  }

  // Record database query metric
  recordDatabaseQuery(operation: string, duration: number): void {
    this.record('database_query_duration', duration, 'ms', {
      operation,
    })
  }

  // Record cache hit/miss
  recordCache(hit: boolean): void {
    this.record('cache_access', 1, 'count', {
      result: hit ? 'hit' : 'miss',
    })
  }

  // Get metrics summary
  async getSummary(timeRange: number = 3600000): Promise<MetricsSummary> {
    try {
      const now = Date.now()
      const startTime = now - timeRange

      // Get metrics from cache
      const cacheKey = CacheKeys.metricsSummary()
      const cachedSummary = await cacheService.get<MetricsSummary>(cacheKey)

      if (cachedSummary) {
        return cachedSummary
      }

      // Calculate metrics from buffer
      const recentMetrics = this.metricsBuffer.filter(m => m.timestamp >= startTime)

      const requests = this.calculateRequestMetrics(recentMetrics)
      const performance = this.calculatePerformanceMetrics(recentMetrics)
      const errors = this.calculateErrorMetrics(recentMetrics)
      const business = await this.calculateBusinessMetrics()

      const summary: MetricsSummary = {
        requests,
        performance,
        errors,
        business,
      }

      // Cache summary
      await cacheService.set(cacheKey, summary, CacheTTL.SHORT)

      return summary
    } catch (error) {
      logger.error('Error getting metrics summary', { error: error instanceof Error ? error.message : 'Unknown error' })
      
      return {
        requests: { total: 0, perSecond: 0, byMethod: {}, byStatus: {} },
        performance: { averageResponseTime: 0, p50: 0, p95: 0, p99: 0 },
        errors: { total: 0, rate: 0, byType: {} },
        business: { activeUsers: 0, ordersCreated: 0, revenue: 0 },
      }
    }
  }

  // Calculate request metrics
  private calculateRequestMetrics(metrics: Metric[]): MetricsSummary['requests'] {
    const requestMetrics = metrics.filter(m => m.name === 'http_request_total')
    
    const total = requestMetrics.length
    const timeSpan = metrics.length > 0 
      ? (metrics[metrics.length - 1].timestamp - metrics[0].timestamp) / 1000
      : 1
    
    const perSecond = total / timeSpan

    const byMethod: Record<string, number> = {}
    const byStatus: Record<string, number> = {}

    requestMetrics.forEach(m => {
      if (m.tags?.method) {
        byMethod[m.tags.method] = (byMethod[m.tags.method] || 0) + 1
      }
      if (m.tags?.status) {
        byStatus[m.tags.status] = (byStatus[m.tags.status] || 0) + 1
      }
    })

    return { total, perSecond, byMethod, byStatus }
  }

  // Calculate performance metrics
  private calculatePerformanceMetrics(metrics: Metric[]): MetricsSummary['performance'] {
    const durationMetrics = metrics
      .filter(m => m.name === 'http_request_duration')
      .map(m => m.value)
      .sort((a, b) => a - b)

    if (durationMetrics.length === 0) {
      return { averageResponseTime: 0, p50: 0, p95: 0, p99: 0 }
    }

    const sum = durationMetrics.reduce((acc, val) => acc + val, 0)
    const averageResponseTime = sum / durationMetrics.length

    const p50 = this.getPercentile(durationMetrics, 50)
    const p95 = this.getPercentile(durationMetrics, 95)
    const p99 = this.getPercentile(durationMetrics, 99)

    return { averageResponseTime, p50, p95, p99 }
  }

  // Calculate error metrics
  private calculateErrorMetrics(metrics: Metric[]): MetricsSummary['errors'] {
    const errorMetrics = metrics.filter(m => m.name === 'error_total')
    
    const total = errorMetrics.length
    const timeSpan = metrics.length > 0 
      ? (metrics[metrics.length - 1].timestamp - metrics[0].timestamp) / 1000
      : 1
    
    const rate = total / timeSpan

    const byType: Record<string, number> = {}
    errorMetrics.forEach(m => {
      if (m.tags?.type) {
        byType[m.tags.type] = (byType[m.tags.type] || 0) + 1
      }
    })

    return { total, rate, byType }
  }

  // Calculate business metrics
  private async calculateBusinessMetrics(): Promise<MetricsSummary['business']> {
    try {
      const cacheKey = CacheKeys.businessMetrics()
      const cached = await cacheService.get<MetricsSummary['business']>(cacheKey)

      if (cached) {
        return cached
      }

      // In a real implementation, you would query actual data
      const businessMetrics = {
        activeUsers: 0, // Would query active sessions
        ordersCreated: 0, // Would query recent orders
        revenue: 0, // Would query revenue
      }

      await cacheService.set(cacheKey, businessMetrics, CacheTTL.SHORT)

      return businessMetrics
    } catch (error) {
      return {
        activeUsers: 0,
        ordersCreated: 0,
        revenue: 0,
      }
    }
  }

  // Get percentile value
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))]
  }

  // Flush metrics buffer
  private async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    try {
      const metricsToFlush = [...this.metricsBuffer]
      this.metricsBuffer = []

      // Store metrics in cache for aggregation
      const cacheKey = CacheKeys.metricsBuffer()
      await cacheService.set(cacheKey, metricsToFlush, CacheTTL.MEDIUM)

      logger.info(`Flushed ${metricsToFlush.length} metrics`)
    } catch (error) {
      logger.error('Error flushing metrics', { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}

// Update Redis cache keys
declare module '@/lib/redis' {
  interface CacheKeysInterface {
    metricsSummary: () => string
    businessMetrics: () => string
    metricsBuffer: () => string
  }
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance()

// Metrics middleware
export function withMetrics(_handler: any) {
  return async (request: Request, context: any) => {
    const startTime = Date.now()
    const url = new URL(request.url)

    try {
      const response = await _handler(request, context)
      const duration = Date.now() - startTime

      metricsCollector.recordRequest(
        request.method,
        url.pathname,
        response.status,
        duration
      )

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      metricsCollector.recordError(error instanceof Error ? error.name : 'UnknownError', error instanceof Error ? error.message : 'Unknown error')
      metricsCollector.recordRequest(request.method, url.pathname, 500, duration)

      throw error
    }
  }
}

export default metricsCollector
