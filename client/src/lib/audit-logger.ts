import { prisma } from '@/lib/prisma'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/redis'
import { DataMasking } from './encryption'

// Audit log types
export const AUDIT_ACTIONS = {
  // Authentication events
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  MFA_VERIFIED: 'MFA_VERIFIED',
  
  // Authorization events
  ROLE_CHANGE: 'ROLE_CHANGE',
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  
  // Data access events
  DATA_READ: 'DATA_READ',
  DATA_CREATE: 'DATA_CREATE',
  DATA_UPDATE: 'DATA_UPDATE',
  DATA_DELETE: 'DATA_DELETE',
  DATA_EXPORT: 'DATA_EXPORT',
  
  // Security events
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  CSRF_VIOLATION: 'CSRF_VIOLATION',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  
  // System events
  SYSTEM_STARTUP: 'SYSTEM_STARTUP',
  SYSTEM_SHUTDOWN: 'SYSTEM_SHUTDOWN',
  CONFIG_CHANGE: 'CONFIG_CHANGE',
  BACKUP_CREATED: 'BACKUP_CREATED',
  BACKUP_RESTORED: 'BACKUP_RESTORED',
} as const

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS]

// Audit log severity levels
export const AUDIT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export type AuditSeverity = typeof AUDIT_SEVERITY[keyof typeof AUDIT_SEVERITY]

// Audit log interface
export interface AuditLogEntry {
  id?: string
  userId?: string
  sessionId?: string
  action: AuditAction
  resourceType?: string
  resourceId?: string
  severity: AuditSeverity
  message: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  timestamp?: Date
  success?: boolean
}

export class AuditLogger {
  private static instance: AuditLogger
  private logBuffer: AuditLogEntry[] = []
  private bufferSize = 100
  private flushInterval = 30000 // 30 seconds

  private constructor() {
    // Start periodic flush
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  // Log audit event
  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
      }

      // Add to buffer
      this.logBuffer.push(auditEntry)

      // Flush if buffer is full
      if (this.logBuffer.length >= this.bufferSize) {
        await this.flush()
      }

      // Log critical events immediately
      if (entry.severity === AUDIT_SEVERITY.CRITICAL) {
        await this.flush()
      }

      // Cache recent logs for quick access
      await this.cacheRecentLog(auditEntry)
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  }

  // Log authentication event
  async logAuth(
    action: AuditAction,
    userId: string | null,
    success: boolean,
    details: Record<string, unknown> = {},
    request?: Request
  ): Promise<void> {
    const severity = success ? AUDIT_SEVERITY.LOW : AUDIT_SEVERITY.MEDIUM
    
    await this.log({
      userId: userId || undefined,
      action,
      severity,
      message: `${action} ${success ? 'successful' : 'failed'}`,
      details: this.maskSensitiveData(details),
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent'),
      success,
    })
  }

  // Log security event
  async logSecurity(
    action: AuditAction,
    severity: AuditSeverity,
    message: string,
    details: Record<string, unknown> = {},
    request?: Request
  ): Promise<void> {
    await this.log({
      action,
      severity,
      message,
      details: this.maskSensitiveData(details),
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent'),
      success: false,
    })
  }

  // Log data access event
  async logDataAccess(
    action: AuditAction,
    userId: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, unknown> = {},
    request?: Request
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType,
      resourceId,
      severity: AUDIT_SEVERITY.LOW,
      message: `${action} on ${resourceType}:${resourceId}`,
      details: this.maskSensitiveData(details),
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent'),
      success: true,
    })
  }

  // Get audit logs with filtering
  async getLogs(filters: {
    userId?: string
    action?: AuditAction
    severity?: AuditSeverity
    resourceType?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  } = {}): Promise<{
    logs: AuditLogEntry[]
    total: number
  }> {
    try {
      const where: ApiResponse = {}

      if (filters.userId) where.userId = filters.userId
      if (filters.action) where.action = filters.action
      if (filters.severity) where.severity = filters.severity
      if (filters.resourceType) where.resourceType = filters.resourceType
      if (filters.startDate || filters.endDate) {
        where.timestamp = {}
        if (filters.startDate) where.timestamp.gte = filters.startDate
        if (filters.endDate) where.timestamp.lte = filters.endDate
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: filters.limit || 100,
          skip: filters.offset || 0,
        }),
        prisma.auditLog.count({ where }),
      ])

      return { logs, total }
    } catch (error) {
      console.error('Error getting audit logs:', error)
      return { logs: [], total: 0 }
    }
  }

  // Get security alerts
  async getSecurityAlerts(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          severity: {
            in: [AUDIT_SEVERITY.HIGH, AUDIT_SEVERITY.CRITICAL],
          },
          action: {
            in: [
              AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
              AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED,
              AUDIT_ACTIONS.INVALID_TOKEN,
              AUDIT_ACTIONS.CSRF_VIOLATION,
              AUDIT_ACTIONS.XSS_ATTEMPT,
              AUDIT_ACTIONS.SQL_INJECTION_ATTEMPT,
            ],
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      })

      return logs
    } catch (error) {
      console.error('Error getting security alerts:', error)
      return []
    }
  }

  // Get user activity summary
  async getUserActivitySummary(userId: string, days: number = 30): Promise<{
    totalActions: number
    actionsByType: Record<string, number>
    lastActivity: Date | null
    suspiciousActivity: number
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const logs = await prisma.auditLog.findMany({
        where: {
          userId,
          timestamp: { gte: startDate },
        },
        select: {
          action: true,
          timestamp: true,
          severity: true,
        },
      })

      const actionsByType = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const suspiciousActivity = logs.filter(
        log => log.severity === AUDIT_SEVERITY.HIGH || log.severity === AUDIT_SEVERITY.CRITICAL
      ).length

      const lastActivity = logs.length > 0 
        ? logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
        : null

      return {
        totalActions: logs.length,
        actionsByType,
        lastActivity,
        suspiciousActivity,
      }
    } catch (error) {
      console.error('Error getting user activity summary:', error)
      return {
        totalActions: 0,
        actionsByType: {},
        lastActivity: null,
        suspiciousActivity: 0,
      }
    }
  }

  // Flush buffer to database
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return

    try {
      const logsToFlush = [...this.logBuffer]
      this.logBuffer = []

      await prisma.auditLog.createMany({
        data: logsToFlush.map(log => ({
          userId: log.userId,
          sessionId: log.sessionId,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          severity: log.severity,
          message: log.message,
          details: log.details,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.timestamp,
          success: log.success,
        })),
      })

      console.log(`Flushed ${logsToFlush.length} audit logs to database`)
    } catch (error) {
      console.error('Error flushing audit logs:', error)
      // Re-add logs to buffer if flush failed
      this.logBuffer.unshift(...this.logBuffer)
    }
  }

  // Cache recent logs for quick access
  private async cacheRecentLog(log: AuditLogEntry): Promise<void> {
    try {
      const cacheKey = CacheKeys.recentAuditLogs()
      const recentLogs = await cacheService.get<AuditLogEntry[]>(cacheKey) || []
      
      recentLogs.unshift(log)
      
      // Keep only last 100 logs in cache
      if (recentLogs.length > 100) {
        recentLogs.splice(100)
      }
      
      await cacheService.set(cacheKey, recentLogs, CacheTTL.SHORT)
    } catch (error) {
      console.error('Error caching recent audit log:', error)
    }
  }

  // Mask sensitive data in audit details
  private maskSensitiveData(details: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'email', 'phone', 'card']
    
    return DataMasking.maskSensitiveFields(details, sensitiveFields)
  }

  // Get client IP from request
  private getClientIP(request?: Request): string {
    if (!request) return '127.0.0.1'
    
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    return '127.0.0.1'
  }
}

// Audit logging middleware
export function withAuditLogging(
  _action: AuditAction,
  _severity: AuditSeverity = AUDIT_SEVERITY.LOW
) {
  return function (target: ApiResponse, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: ApiResponse[]) {
      const request = args[0]
      const auditLogger = AuditLogger.getInstance()
      
      try {
        const result = await originalMethod.apply(this, args)
        
        // Log successful operation
        await auditLogger.log({
          action,
          severity,
          message: `${action} completed successfully`,
          success: true,
          ipAddress: auditLogger['getClientIP'](request),
          userAgent: request?.headers.get('user-agent'),
        })
        
        return result
      } catch (error) {
        // Log failed operation
        await auditLogger.log({
          action,
          severity: AUDIT_SEVERITY.MEDIUM,
          message: `${action} failed: ${error.message}`,
          details: { error: error.message },
          success: false,
          ipAddress: auditLogger['getClientIP'](request),
          userAgent: request?.headers.get('user-agent'),
        })
        
        throw error
      }
    }

    return descriptor
  }
}

export default AuditLogger
