import { logger } from '@/lib/logger'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/redis'

// Alert severity levels
export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const

export type AlertSeverity = typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY]

// Alert types
export const ALERT_TYPES = {
  SYSTEM: 'SYSTEM',
  PERFORMANCE: 'PERFORMANCE',
  SECURITY: 'SECURITY',
  BUSINESS: 'BUSINESS',
} as const

export type AlertType = typeof ALERT_TYPES[keyof typeof ALERT_TYPES]

// Alert interface
export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  details?: Record<string, unknown>
  timestamp: number
  resolved?: boolean
  resolvedAt?: number
}

// Alert rule interface
export interface AlertRule {
  id: string
  name: string
  type: AlertType
  condition: (data: any) => boolean
  severity: AlertSeverity
  message: string
  cooldown: number // Minimum time between alerts (ms)
}

export class AlertingService {
  private static instance: AlertingService
  private rules: Map<string, AlertRule> = new Map()
  private alerts: Map<string, Alert> = new Map()

  private constructor() {
    this.initializeDefaultRules()
  }

  public static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService()
    }
    return AlertingService.instance
  }

  // Initialize default alert rules
  private initializeDefaultRules(): void {
    // High error rate
    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      type: ALERT_TYPES.PERFORMANCE,
      condition: (data: { errorRate: number }) => data.errorRate > 0.05, // 5% error rate
      severity: ALERT_SEVERITY.WARNING,
      message: 'Error rate is above 5%',
      cooldown: 300000, // 5 minutes
    })

    // Slow response time
    this.addRule({
      id: 'slow-response-time',
      name: 'Slow Response Time',
      type: ALERT_TYPES.PERFORMANCE,
      condition: (data: { avgResponseTime: number }) => data.avgResponseTime > 3000, // 3 seconds
      severity: ALERT_SEVERITY.WARNING,
      message: 'Average response time is above 3 seconds',
      cooldown: 600000, // 10 minutes
    })

    // High memory usage
    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      type: ALERT_TYPES.SYSTEM,
      condition: (data: { memoryUsage: number }) => data.memoryUsage > 90, // 90%
      severity: ALERT_SEVERITY.ERROR,
      message: 'Memory usage is above 90%',
      cooldown: 300000, // 5 minutes
    })

    // Database connection issues
    this.addRule({
      id: 'database-unhealthy',
      name: 'Database Unhealthy',
      type: ALERT_TYPES.SYSTEM,
      condition: (data: { databaseStatus: string }) => data.databaseStatus === 'unhealthy',
      severity: ALERT_SEVERITY.CRITICAL,
      message: 'Database is unhealthy',
      cooldown: 60000, // 1 minute
    })

    // Redis connection issues
    this.addRule({
      id: 'redis-unhealthy',
      name: 'Redis Unhealthy',
      type: ALERT_TYPES.SYSTEM,
      condition: (data: { redisStatus: string }) => data.redisStatus === 'unhealthy',
      severity: ALERT_SEVERITY.CRITICAL,
      message: 'Redis is unhealthy',
      cooldown: 60000, // 1 minute
    })

    // Security: Too many failed login attempts
    this.addRule({
      id: 'failed-login-spike',
      name: 'Failed Login Spike',
      type: ALERT_TYPES.SECURITY,
      condition: (data: { failedLogins: number }) => data.failedLogins > 50, // 50 failed attempts
      severity: ALERT_SEVERITY.ERROR,
      message: 'Unusual number of failed login attempts detected',
      cooldown: 600000, // 10 minutes
    })

    // Business: Order failure spike
    this.addRule({
      id: 'order-failure-spike',
      name: 'Order Failure Spike',
      type: ALERT_TYPES.BUSINESS,
      condition: (data: { orderFailureRate: number }) => data.orderFailureRate > 0.10, // 10% failure rate
      severity: ALERT_SEVERITY.ERROR,
      message: 'Order failure rate is above 10%',
      cooldown: 300000, // 5 minutes
    })
  }

  // Add alert rule
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule)
    logger.info(`Alert rule added: ${rule.name}`, { ruleId: rule.id })
  }

  // Remove alert rule
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
    logger.info(`Alert rule removed`, { ruleId })
  }

  // Check rules and trigger alerts
  async checkRules(data: Record<string, unknown>): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = []

    for (const [ruleId, rule] of this.rules) {
      try {
        // Check if rule condition is met
        if (rule.condition(data)) {
          // Check cooldown
          const canTrigger = await this.canTriggerAlert(ruleId, rule.cooldown)
          
          if (canTrigger) {
            const alert = await this.triggerAlert(rule, data)
            triggeredAlerts.push(alert)
          }
        }
      } catch (error) {
        logger.error(`Error checking alert rule: ${rule.name}`, {
          ruleId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return triggeredAlerts
  }

  // Trigger an alert
  private async triggerAlert(rule: AlertRule, data: Record<string, unknown>): Promise<Alert> {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      message: rule.message,
      details: data,
      timestamp: Date.now(),
      resolved: false,
    }

    // Store alert
    this.alerts.set(alert.id, alert)

    // Cache alert
    await this.cacheAlert(alert)

    // Update last trigger time
    await this.updateLastTriggerTime(rule.id)

    // Log alert
    logger.warn(`Alert triggered: ${rule.name}`, {
      alertId: alert.id,
      severity: alert.severity,
      details: alert.details,
    })

    // Send notifications (email, Slack, etc.)
    await this.sendNotifications(alert)

    return alert
  }

  // Check if alert can be triggered (cooldown check)
  private async canTriggerAlert(ruleId: string, cooldown: number): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.alertCooldown(ruleId)
      const lastTriggerTime = await cacheService.get<number>(cacheKey)

      if (!lastTriggerTime) {
        return true
      }

      const timeSinceLastTrigger = Date.now() - lastTriggerTime
      return timeSinceLastTrigger >= cooldown
    } catch (error) {
      logger.error('Error checking alert cooldown', { ruleId, error: error instanceof Error ? error.message : 'Unknown error' })
      return true // Allow trigger if cooldown check fails
    }
  }

  // Update last trigger time
  private async updateLastTriggerTime(ruleId: string): Promise<void> {
    try {
      const cacheKey = CacheKeys.alertCooldown(ruleId)
      await cacheService.set(cacheKey, Date.now(), Math.floor(CacheTTL.MEDIUM / 1000))
    } catch (error) {
      logger.error('Error updating alert trigger time', { ruleId, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  // Cache alert
  private async cacheAlert(alert: Alert): Promise<void> {
    try {
      const cacheKey = CacheKeys.recentAlerts()
      const recentAlerts = await cacheService.get<Alert[]>(cacheKey) || []
      
      recentAlerts.unshift(alert)
      
      // Keep only last 100 alerts
      if (recentAlerts.length > 100) {
        recentAlerts.splice(100)
      }
      
      await cacheService.set(cacheKey, recentAlerts, CacheTTL.MEDIUM)
    } catch (error) {
      logger.error('Error caching alert', { alertId: alert.id, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  // Send notifications
  private async sendNotifications(alert: Alert): Promise<void> {
    try {
      // In a real implementation, you would send notifications via:
      // - Email (SendGrid, AWS SES)
      // - Slack (Webhook)
      // - PagerDuty (API)
      // - SMS (Twilio)
      
      logger.info(`Sending alert notifications`, {
        alertId: alert.id,
        severity: alert.severity,
        channels: ['email', 'slack'],
      })

      // Example: Send to Slack
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackNotification(alert)
      }

      // Example: Send email
      if (process.env.ALERT_EMAIL_TO) {
        await this.sendEmailNotification(alert)
      }
    } catch (error) {
      logger.error('Error sending alert notifications', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Send Slack notification
  private async sendSlackNotification(alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL
      if (!webhookUrl) return

      const color = {
        info: '#36a64f',
        warning: '#ff9800',
        error: '#f44336',
        critical: '#9c27b0',
      }[alert.severity]

      const payload = {
        attachments: [
          {
            color,
            title: alert.title,
            text: alert.message,
            fields: [
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Type',
                value: alert.type,
                short: true,
              },
              {
                title: 'Time',
                value: new Date(alert.timestamp).toISOString(),
                short: false,
              },
            ],
            footer: 'E-Commerce Alert System',
            ts: Math.floor(alert.timestamp / 1000),
          },
        ],
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      logger.info('Slack notification sent', { alertId: alert.id })
    } catch (error) {
      logger.error('Error sending Slack notification', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Send email notification
  private async sendEmailNotification(alert: Alert): Promise<void> {
    try {
      // In a real implementation, you would use an email service like SendGrid
      logger.info('Email notification sent', { alertId: alert.id })
    } catch (error) {
      logger.error('Error sending email notification', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Get recent alerts
  async getRecentAlerts(limit: number = 50): Promise<Alert[]> {
    try {
      const cacheKey = CacheKeys.recentAlerts()
      const recentAlerts = await cacheService.get<Alert[]>(cacheKey) || []
      
      return recentAlerts.slice(0, limit)
    } catch (error) {
      logger.error('Error getting recent alerts', { error: error instanceof Error ? error.message : 'Unknown error' })
      return []
    }
  }

  // Resolve an alert
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.alerts.get(alertId)
      if (!alert) {
        return false
      }

      alert.resolved = true
      alert.resolvedAt = Date.now()

      logger.info(`Alert resolved`, { alertId })

      return true
    } catch (error) {
      logger.error('Error resolving alert', { alertId, error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }
}

// Update Redis cache keys
declare module '@/lib/redis' {
  interface CacheKeysInterface {
    alertCooldown: (ruleId: string) => string
    recentAlerts: () => string
  }
}

export const alertingService = AlertingService.getInstance()
export default alertingService
