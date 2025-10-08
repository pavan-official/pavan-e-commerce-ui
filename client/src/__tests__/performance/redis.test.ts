import { CacheKeys, CacheTTL, cacheService } from '@/lib/redis'

// Mock Redis for testing
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    flushall: jest.fn(),
    info: jest.fn(),
    pipeline: jest.fn(() => ({
      setex: jest.fn(),
      exec: jest.fn(),
    })),
    mget: jest.fn(),
  }))
})

describe('Redis Cache Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CacheService', () => {
    it('should be a singleton', () => {
      const instance1 = cacheService
      const instance2 = cacheService
      expect(instance1).toBe(instance2)
    })

    it('should set cache with TTL', async () => {
      const mockRedis = require('ioredis')
      const mockSetex = jest.fn().mockResolvedValue('OK')
      mockRedis.mockImplementation(() => ({
        setex: mockSetex,
        on: jest.fn(),
      }))

      await cacheService.set('test-key', { data: 'test' }, 3600)

      expect(mockSetex).toHaveBeenCalledWith('test-key', 3600, JSON.stringify({ data: 'test' }))
    })

    it('should get cache value', async () => {
      const mockRedis = require('ioredis')
      const mockGet = jest.fn().mockResolvedValue(JSON.stringify({ data: 'test' }))
      mockRedis.mockImplementation(() => ({
        get: mockGet,
        on: jest.fn(),
      }))

      const result = await cacheService.get('test-key')

      expect(mockGet).toHaveBeenCalledWith('test-key')
      expect(result).toEqual({ data: 'test' })
    })

    it('should return null for non-existent key', async () => {
      const mockRedis = require('ioredis')
      const mockGet = jest.fn().mockResolvedValue(null)
      mockRedis.mockImplementation(() => ({
        get: mockGet,
        on: jest.fn(),
      }))

      const result = await cacheService.get('non-existent-key')

      expect(result).toBeNull()
    })

    it('should delete cache key', async () => {
      const mockRedis = require('ioredis')
      const mockDel = jest.fn().mockResolvedValue(1)
      mockRedis.mockImplementation(() => ({
        del: mockDel,
        on: jest.fn(),
      }))

      await cacheService.del('test-key')

      expect(mockDel).toHaveBeenCalledWith('test-key')
    })

    it('should check if key exists', async () => {
      const mockRedis = require('ioredis')
      const mockExists = jest.fn().mockResolvedValue(1)
      mockRedis.mockImplementation(() => ({
        exists: mockExists,
        on: jest.fn(),
      }))

      const result = await cacheService.exists('test-key')

      expect(mockExists).toHaveBeenCalledWith('test-key')
      expect(result).toBe(true)
    })

    it('should increment counter', async () => {
      const mockRedis = require('ioredis')
      const mockIncr = jest.fn().mockResolvedValue(5)
      const mockExpire = jest.fn().mockResolvedValue(1)
      mockRedis.mockImplementation(() => ({
        incr: mockIncr,
        expire: mockExpire,
        on: jest.fn(),
      }))

      const result = await cacheService.incr('counter', 3600)

      expect(mockIncr).toHaveBeenCalledWith('counter')
      expect(mockExpire).toHaveBeenCalledWith('counter', 3600)
      expect(result).toBe(5)
    })

    it('should handle errors gracefully', async () => {
      const mockRedis = require('ioredis')
      const mockSetex = jest.fn().mockRejectedValue(new Error('Redis error'))
      mockRedis.mockImplementation(() => ({
        setex: mockSetex,
        on: jest.fn(),
      }))

      // Should not throw error
      await expect(cacheService.set('test-key', { data: 'test' }, 3600)).resolves.toBeUndefined()
    })
  })

  describe('Cache Keys', () => {
    it('should generate user cache keys', () => {
      expect(CacheKeys.user('user-123')).toBe('user:user-123')
      expect(CacheKeys.userSession('session-456')).toBe('session:session-456')
      expect(CacheKeys.userCart('user-123')).toBe('cart:user-123')
      expect(CacheKeys.userWishlist('user-123')).toBe('wishlist:user-123')
    })

    it('should generate product cache keys', () => {
      expect(CacheKeys.product('product-123')).toBe('product:product-123')
      expect(CacheKeys.products('category=electronics')).toBe('products:category=electronics')
      expect(CacheKeys.productReviews('product-123')).toBe('reviews:product-123')
      expect(CacheKeys.productRating('product-123')).toBe('rating:product-123')
    })

    it('should generate analytics cache keys', () => {
      expect(CacheKeys.analytics('sales', 'month')).toBe('analytics:sales:month')
      expect(CacheKeys.dashboard()).toBe('dashboard:overview')
    })

    it('should generate search cache keys', () => {
      expect(CacheKeys.search('laptop')).toBe('search:laptop')
      expect(CacheKeys.searchSuggestions('lap')).toBe('suggestions:lap')
    })

    it('should generate rate limiting keys', () => {
      expect(CacheKeys.rateLimit('192.168.1.1', 'window-1')).toBe('rate:192.168.1.1:window-1')
    })
  })

  describe('Cache TTL', () => {
    it('should have correct TTL values', () => {
      expect(CacheTTL.SHORT).toBe(300)      // 5 minutes
      expect(CacheTTL.MEDIUM).toBe(1800)    // 30 minutes
      expect(CacheTTL.LONG).toBe(3600)      // 1 hour
      expect(CacheTTL.VERY_LONG).toBe(86400) // 24 hours
      expect(CacheTTL.SESSION).toBe(7200)   // 2 hours
      expect(CacheTTL.ANALYTICS).toBe(1800) // 30 minutes
    })
  })
})
