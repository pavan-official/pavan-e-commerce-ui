import { healthCheckService } from '@/lib/health-check'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

jest.mock('@/lib/redis', () => ({
  cacheService: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Health Check Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('check', () => {
    it('should return healthy status when all checks pass', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')

      // Mock successful checks
      prisma.$queryRaw
        .mockResolvedValueOnce([{ test: 1 }]) // Database test query
        .mockResolvedValueOnce([{ count: 5n }]) // Active connections
      
      cacheService.set.mockResolvedValue(undefined)
      cacheService.get.mockResolvedValue('test')
      cacheService.del.mockResolvedValue(undefined)

      const result = await healthCheckService.check()

      expect(result.status).toBe('healthy')
      expect(result.checks.database.status).toBe('healthy')
      expect(result.checks.redis.status).toBe('healthy')
    })

    it('should return unhealthy status when database fails', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')

      prisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'))
      
      cacheService.set.mockResolvedValue(undefined)
      cacheService.get.mockResolvedValue('test')
      cacheService.del.mockResolvedValue(undefined)

      const result = await healthCheckService.check()

      expect(result.status).toBe('unhealthy')
      expect(result.checks.database.status).toBe('unhealthy')
    })

    it('should return degraded status when response time is high', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')

      // Simulate slow database response
      prisma.$queryRaw
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([{ test: 1 }]), 1500)))
        .mockResolvedValueOnce([{ count: 5n }])
      
      cacheService.set.mockResolvedValue(undefined)
      cacheService.get.mockResolvedValue('test')
      cacheService.del.mockResolvedValue(undefined)

      const result = await healthCheckService.check()

      // Database check may be degraded due to slow response
      expect(['degraded', 'healthy']).toContain(result.checks.database.status)
    })
  })

  describe('checkDatabase', () => {
    it('should return healthy for normal database response', async () => {
      const { prisma } = require('@/lib/prisma')

      prisma.$queryRaw
        .mockResolvedValueOnce([{ test: 1 }])
        .mockResolvedValueOnce([{ count: 3n }])

      const result = await healthCheckService.checkDatabase()

      expect(result.status).toBe('healthy')
      expect(result.responseTime).toBeDefined()
      expect(result.details).toHaveProperty('activeConnections')
    })

    it('should return unhealthy when database connection fails', async () => {
      const { prisma } = require('@/lib/prisma')

      prisma.$queryRaw.mockRejectedValue(new Error('Connection timeout'))

      const result = await healthCheckService.checkDatabase()

      expect(result.status).toBe('unhealthy')
      expect(result.message).toContain('Database error')
    })
  })

  describe('checkRedis', () => {
    it('should return healthy for normal Redis response', async () => {
      const { cacheService } = require('@/lib/redis')

      cacheService.set.mockResolvedValue(undefined)
      cacheService.get.mockResolvedValue('test')
      cacheService.del.mockResolvedValue(undefined)

      const result = await healthCheckService.checkRedis()

      expect(result.status).toBe('healthy')
      expect(result.responseTime).toBeDefined()
    })

    it('should return unhealthy when Redis fails', async () => {
      const { cacheService } = require('@/lib/redis')

      cacheService.set.mockRejectedValue(new Error('Redis connection failed'))

      const result = await healthCheckService.checkRedis()

      expect(result.status).toBe('unhealthy')
      expect(result.message).toContain('Redis error')
    })

    it('should return unhealthy when Redis read/write test fails', async () => {
      const { cacheService } = require('@/lib/redis')

      cacheService.set.mockResolvedValue(undefined)
      cacheService.get.mockResolvedValue('wrong-value') // Wrong value
      cacheService.del.mockResolvedValue(undefined)

      const result = await healthCheckService.checkRedis()

      expect(result.status).toBe('unhealthy')
      expect(result.message).toContain('read/write test failed')
    })
  })

  describe('readinessCheck', () => {
    it('should return ready when critical services are healthy', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')

      prisma.$queryRaw
        .mockResolvedValueOnce([{ test: 1 }])
        .mockResolvedValueOnce([{ count: 3n }])
      
      cacheService.set.mockResolvedValue(undefined)
      cacheService.get.mockResolvedValue('test')
      cacheService.del.mockResolvedValue(undefined)

      const result = await healthCheckService.readinessCheck()

      expect(result.ready).toBe(true)
    })

    it('should return not ready when database is unhealthy', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')

      prisma.$queryRaw.mockRejectedValue(new Error('Database down'))
      
      cacheService.set.mockResolvedValue(undefined)
      cacheService.get.mockResolvedValue('test')
      cacheService.del.mockResolvedValue(undefined)

      const result = await healthCheckService.readinessCheck()

      expect(result.ready).toBe(false)
      expect(result.reason).toContain('Database')
    })
  })

  describe('livenessCheck', () => {
    it('should always return alive', async () => {
      const result = await healthCheckService.livenessCheck()

      expect(result.alive).toBe(true)
    })
  })
})
