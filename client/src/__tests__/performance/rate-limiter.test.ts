import { RateLimiter, rateLimiters, withRateLimit } from '@/lib/rateLimiter'
import { NextRequest } from 'next/server'

// Mock Redis cache service
jest.mock('@/lib/redis', () => ({
  cacheService: {
    incr: jest.fn(),
  },
  CacheKeys: {
    rateLimit: (identifier: string, window: string) => `rate:${identifier}:${window}`,
  },
}))

describe('Rate Limiter', () => {
  let rateLimiter: RateLimiter
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 10,
    })
    
    mockRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    })
  })

  describe('RateLimiter', () => {
    it('should allow requests within limit', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.incr.mockResolvedValue(5) // 5th request

      const result = await rateLimiter.check(mockRequest)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
      expect(result.totalHits).toBe(5)
    })

    it('should block requests exceeding limit', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.incr.mockResolvedValue(11) // 11th request (exceeds limit of 10)

      const result = await rateLimiter.check(mockRequest)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.totalHits).toBe(11)
    })

    it('should use custom key generator', async () => {
      const customRateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyGenerator: (req) => `custom:${req.url}`,
      })

      const { cacheService } = require('@/lib/redis')
      cacheService.incr.mockResolvedValue(1)

      await customRateLimiter.check(mockRequest)

      expect(cacheService.incr).toHaveBeenCalledWith(
        'rate:custom:http://localhost:3000/api/test:0',
        expect.any(Number)
      )
    })

    it('should handle Redis errors gracefully', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.incr.mockRejectedValue(new Error('Redis error'))

      const result = await rateLimiter.check(mockRequest)

      // Should fail open (allow request)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(10)
    })

    it('should create middleware that blocks requests', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.incr.mockResolvedValue(11) // Exceeds limit

      const middleware = rateLimiter.createMiddleware()
      const response = await middleware(mockRequest)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(429)
      
      const responseData = await response?.json()
      expect(responseData.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should create middleware that allows requests', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.incr.mockResolvedValue(5) // Within limit

      const middleware = rateLimiter.createMiddleware()
      const response = await middleware(mockRequest)

      expect(response).toBeNull() // null means allow request to continue
    })
  })

  describe('Pre-configured Rate Limiters', () => {
    it('should have API rate limiter with correct settings', () => {
      expect(rateLimiters.api['options'].windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(rateLimiters.api['options'].maxRequests).toBe(100)
    })

    it('should have auth rate limiter with correct settings', () => {
      expect(rateLimiters.auth['options'].windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(rateLimiters.auth['options'].maxRequests).toBe(5)
    })

    it('should have search rate limiter with correct settings', () => {
      expect(rateLimiters.search['options'].windowMs).toBe(1 * 60 * 1000) // 1 minute
      expect(rateLimiters.search['options'].maxRequests).toBe(30)
    })

    it('should have orders rate limiter with correct settings', () => {
      expect(rateLimiters.orders['options'].windowMs).toBe(5 * 60 * 1000) // 5 minutes
      expect(rateLimiters.orders['options'].maxRequests).toBe(10)
    })

    it('should have reviews rate limiter with correct settings', () => {
      expect(rateLimiters.reviews['options'].windowMs).toBe(60 * 60 * 1000) // 1 hour
      expect(rateLimiters.reviews['options'].maxRequests).toBe(5)
    })
  })

  describe('withRateLimit utility', () => {
    it('should execute handler when rate limit allows', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.incr.mockResolvedValue(5) // Within limit

      const handler = jest.fn().mockResolvedValue(new Response('Success'))
      const response = await withRateLimit(mockRequest, rateLimiter, handler)

      expect(handler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should return rate limit response when limit exceeded', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.incr.mockResolvedValue(11) // Exceeds limit

      const handler = jest.fn().mockResolvedValue(new Response('Success'))
      const response = await withRateLimit(mockRequest, rateLimiter, handler)

      expect(handler).not.toHaveBeenCalled()
      expect(response.status).toBe(429)
    })
  })
})
