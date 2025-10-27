import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { DataMasking } from './encryption'

// Log levels
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const

// Log colors
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
}

winston.addColors(LOG_COLORS)

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info
    
    // Mask sensitive data
    const maskedMeta = maskSensitiveData(meta)
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...maskedMeta,
    })
  })
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

// Mask sensitive data in logs
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
    'authorization',
    'cookie',
    'creditCard',
    'ssn',
  ]

  const masked = { ...data }

  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = '[REDACTED]'
    } else if (key.toLowerCase().includes('email')) {
      masked[key] = DataMasking.maskEmail(String(masked[key]))
    } else if (key.toLowerCase().includes('phone')) {
      masked[key] = DataMasking.maskPhone(String(masked[key]))
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key])
    }
  }

  return masked
}

// Create logger instance
class Logger {
  private static instance: Logger
  private logger: winston.Logger

  private constructor() {
    const transports: winston.transport[] = []

    // Console transport for all environments
    transports.push(
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? customFormat : consoleFormat,
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      })
    )

    // File transport for production
    if (process.env.NODE_ENV === 'production') {
      // Error log file
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          format: customFormat,
        })
      )

      // Combined log file
      transports.push(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: customFormat,
        })
      )

      // HTTP log file
      transports.push(
        new DailyRotateFile({
          filename: 'logs/http-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'http',
          maxSize: '20m',
          maxFiles: '7d',
          format: customFormat,
        })
      )
    }

    this.logger = winston.createLogger({
      levels: LOG_LEVELS,
      transports,
      exitOnError: false,
    })
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  // Error logging
  error(message: string, meta?: any): void {
    this.logger.error(message, this.enrichMeta(meta))
  }

  // Warning logging
  warn(message: string, meta?: any): void {
    this.logger.warn(message, this.enrichMeta(meta))
  }

  // Info logging
  info(message: string, meta?: any): void {
    this.logger.info(message, this.enrichMeta(meta))
  }

  // HTTP logging
  http(message: string, meta?: any): void {
    this.logger.http(message, this.enrichMeta(meta))
  }

  // Debug logging
  debug(message: string, meta?: any): void {
    this.logger.debug(message, this.enrichMeta(meta))
  }

  // Log API request
  logRequest(req: Request, duration?: number): void {
    const url = new URL(req.url)
    this.http(`${req.method} ${url.pathname}`, {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: req.headers.get('user-agent'),
      ip: this.getClientIP(req),
      duration: duration ? `${duration}ms` : undefined,
    })
  }

  // Log API response
  logResponse(req: Request, statusCode: number, duration: number): void {
    const url = new URL(req.url)
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http'
    
    this.logger.log(level, `${req.method} ${url.pathname} ${statusCode}`, {
      method: req.method,
      path: url.pathname,
      statusCode,
      duration: `${duration}ms`,
      ip: this.getClientIP(req),
    })
  }

  // Log error with stack trace
  logError(error: Error, context?: string): void {
    this.error(`${context || 'Error'}: ${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    })
  }

  // Log security event
  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn'
    
    this.logger.log(level, `SECURITY: ${event}`, {
      ...this.enrichMeta(meta),
      securityEvent: true,
      severity,
    })
  }

  // Log performance metric
  logMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    this.info(`METRIC: ${name}`, {
      metric: {
        name,
        value,
        unit,
        tags,
      },
    })
  }

  // Log business event
  logBusiness(event: string, meta?: any): void {
    this.info(`BUSINESS: ${event}`, {
      ...this.enrichMeta(meta),
      businessEvent: true,
    })
  }

  // Enrich metadata with context
  private enrichMeta(meta?: any): any {
    return {
      ...meta,
      environment: process.env.NODE_ENV,
      service: 'ecommerce-api',
      version: process.env.APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
    }
  }

  // Get client IP from request
  private getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const cfConnectingIP = req.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    return '127.0.0.1'
  }

  // Get underlying Winston logger
  getWinstonLogger(): winston.Logger {
    return this.logger
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Request logging middleware
export function withRequestLogging(_handler: any) {
  return async (request: Request, context: any) => {
    const startTime = Date.now()
    const url = new URL(request.url)
    
    logger.http(`→ ${request.method} ${url.pathname}`)
    
    try {
      const response = await _handler(request, context)
      const duration = Date.now() - startTime
      
      logger.logResponse(request, response.status, duration)
      
      return response
    } catch (_error) {
      const duration = Date.now() - startTime
      
      logger.error(`✗ ${request.method} ${url.pathname} failed after ${duration}ms`, {
        error: _error instanceof Error ? _error.message : 'Unknown error',
        stack: _error instanceof Error ? _error.stack : undefined,
      })
      
      throw _error
    }
  }
}

// Performance logging decorator
export function logPerformance(_threshold: number = 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      
      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        
        if (duration > _threshold) {
          logger.warn(`Slow operation: ${propertyKey} took ${duration}ms`, {
            method: propertyKey,
            duration,
            threshold: _threshold,
          })
        }
        
        return result
      } catch (_error) {
        const duration = Date.now() - startTime
        logger.error(`Operation failed: ${propertyKey} after ${duration}ms`, {
          method: propertyKey,
          duration,
          error: _error instanceof Error ? _error.message : 'Unknown error',
        })
        throw _error
      }
    }

    return descriptor
  }
}

export default logger
