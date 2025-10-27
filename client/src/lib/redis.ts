import { Redis } from 'ioredis'

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
})

// Redis connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error)
})

redis.on('close', () => {
  console.log('🔌 Redis connection closed')
})

// Cache utility functions
export class CacheService {
  private static instance: CacheService
  private redis: Redis

  private constructor() {
    this.redis = redis
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  // Set cache with TTL
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      await this.redis.setex(key, ttlSeconds, serializedValue)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Get cache value
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // Delete cache key
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  // Set multiple keys
  async mset(keyValuePairs: Record<string, unknown>, ttlSeconds: number = 3600): Promise<void> {
    try {
      const pipeline = this.redis.pipeline()
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value)
        pipeline.setex(key, ttlSeconds, serializedValue)
      })
      
      await pipeline.exec()
    } catch (error) {
      console.error('Cache mset error:', error)
    }
  }

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys)
      return values.map(value => value ? JSON.parse(value) : null)
    } catch (error) {
      console.error('Cache mget error:', error)
      return keys.map(() => null)
    }
  }

  // Increment counter
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const result = await this.redis.incr(key)
      if (ttlSeconds && result === 1) {
        await this.redis.expire(key, ttlSeconds)
      }
      return result
    } catch (error) {
      console.error('Cache incr error:', error)
      return 0
    }
  }

  // Set with expiration
  async setex(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.set(key, value, ttlSeconds)
  }

  // Get TTL
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key)
    } catch (error) {
      console.error('Cache ttl error:', error)
      return -1
    }
  }

  // Clear all cache (use with caution)
  async flushall(): Promise<void> {
    try {
      await this.redis.flushall()
    } catch (error) {
      console.error('Cache flushall error:', error)
    }
  }

  // Get Redis info
  async info(): Promise<string> {
    try {
      return await this.redis.info()
    } catch (error) {
      console.error('Cache info error:', error)
      return ''
    }
  }
}

// Cache key generators
export const CacheKeys = {
  // User cache keys
  user: (id: string) => `user:${id}`,
  userSession: (sessionId: string) => `session:${sessionId}`,
  userCart: (userId: string) => `cart:${userId}`,
  userWishlist: (userId: string) => `wishlist:${userId}`,
  
  // Product cache keys
  product: (id: string) => `product:${id}`,
  products: (filters: string) => `products:${filters}`,
  productReviews: (productId: string) => `reviews:${productId}`,
  productRating: (productId: string) => `rating:${productId}`,
  
  // Category cache keys
  categories: () => 'categories:all',
  category: (id: string) => `category:${id}`,
  
  // Order cache keys
  order: (id: string) => `order:${id}`,
  userOrders: (userId: string) => `orders:${userId}`,
  
  // Analytics cache keys
  analytics: (type: string, params: string) => `analytics:${type}:${params}`,
  dashboard: () => 'dashboard:overview',
  
  // Search cache keys
  search: (query: string) => `search:${query}`,
  searchSuggestions: (query: string) => `suggestions:${query}`,
  
  // Rate limiting keys
  rateLimit: (identifier: string, window: string) => `rate:${identifier}:${window}`,
  
  // MFA cache keys
  mfaSetup: (userId: string) => `mfa:setup:${userId}`,
  mfaData: (userId: string) => `mfa:data:${userId}`,
  mfaVerified: (userId: string) => `mfa:verified:${userId}`,
  
  // RBAC cache keys
  userPermissions: (userId: string) => `permissions:${userId}`,
  userRole: (userId: string) => `role:${userId}`,
  
  // Audit logging cache keys
  recentAuditLogs: () => 'audit:recent',
  securityAlerts: () => 'audit:security:alerts',
  
  // Metrics cache keys
  metricsSummary: () => 'metrics:summary',
  businessMetrics: () => 'metrics:business',
  metricsBuffer: () => 'metrics:buffer',
  
  // Alerting cache keys
  alertCooldown: (ruleId: string) => `alert:cooldown:${ruleId}`,
  recentAlerts: () => 'alerts:recent',
}

// Cache TTL constants
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  SESSION: 7200,   // 2 hours
  ANALYTICS: 1800, // 30 minutes
}

export default redis
export const cacheService = CacheService.getInstance()
