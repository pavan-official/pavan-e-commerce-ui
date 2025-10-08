import { logger } from '@/lib/logger'

// Mock Winston
jest.mock('winston', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  }

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      splat: jest.fn(),
      json: jest.fn(),
      printf: jest.fn(),
      colorize: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
    addColors: jest.fn(),
  }
})

jest.mock('winston-daily-rotate-file', () => {
  return jest.fn()
})

jest.mock('@/lib/encryption', () => ({
  DataMasking: {
    maskEmail: jest.fn((email) => email.replace(/(.{2})(.*)(@.*)/, '$1***$3')),
    maskPhone: jest.fn((phone) => phone.replace(/\d(?=\d{4})/g, '*')),
  },
}))

describe('Logger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Logging', () => {
    it('should log error messages', () => {
      logger.error('Test error message', { userId: 'user-123' })

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should log warning messages', () => {
      logger.warn('Test warning message')

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.warn).toHaveBeenCalled()
    })

    it('should log info messages', () => {
      logger.info('Test info message')

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should log http messages', () => {
      logger.http('Test http message')

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.http).toHaveBeenCalled()
    })

    it('should log debug messages', () => {
      logger.debug('Test debug message')

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.debug).toHaveBeenCalled()
    })
  })

  describe('Request Logging', () => {
    it('should log API requests', () => {
      const mockRequest = new Request('http://localhost:3000/api/products?category=electronics', {
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      logger.logRequest(mockRequest, 150)

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.http).toHaveBeenCalledWith(
        'GET /api/products',
        expect.objectContaining({
          method: 'GET',
          path: '/api/products',
        })
      )
    })

    it('should log API responses', () => {
      const mockRequest = new Request('http://localhost:3000/api/products', {
        method: 'POST',
      })

      logger.logResponse(mockRequest, 201, 250)

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.log).toHaveBeenCalled()
    })

    it('should log errors with status 500', () => {
      const mockRequest = new Request('http://localhost:3000/api/products', {
        method: 'GET',
      })

      logger.logResponse(mockRequest, 500, 100)

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        expect.any(String),
        expect.any(Object)
      )
    })
  })

  describe('Error Logging', () => {
    it('should log errors with stack traces', () => {
      const error = new Error('Test error')
      logger.logError(error, 'Test context')

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String),
          }),
        })
      )
    })
  })

  describe('Security Logging', () => {
    it('should log security events', () => {
      logger.logSecurity('Failed login attempt', 'high', { userId: 'user-123' })

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('SECURITY'),
        expect.objectContaining({
          securityEvent: true,
          severity: 'high',
        })
      )
    })
  })

  describe('Metric Logging', () => {
    it('should log performance metrics', () => {
      logger.logMetric('api_response_time', 150, 'ms', { endpoint: '/api/products' })

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('METRIC'),
        expect.objectContaining({
          metric: expect.objectContaining({
            name: 'api_response_time',
            value: 150,
            unit: 'ms',
          }),
        })
      )
    })
  })

  describe('Business Event Logging', () => {
    it('should log business events', () => {
      logger.logBusiness('Order created', { orderId: 'order-123', amount: 99.99 })

      const mockLogger = require('winston').createLogger()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('BUSINESS'),
        expect.objectContaining({
          businessEvent: true,
        })
      )
    })
  })
})
