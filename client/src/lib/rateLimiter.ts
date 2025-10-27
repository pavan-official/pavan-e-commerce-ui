import { CacheKeys, cacheService } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}

export class RateLimiter {
  private options: Required<RateLimitOptions>

  constructor(options: RateLimitOptions) {
    this.options = {
      keyGenerator: (req) => {
        // Default: use IP address
        const forwarded = req.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
        return ip
      },
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later.',
      ...options,
    }
  }

  async check(request: NextRequest): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    totalHits: number
  }> {
    const key = this.options.keyGenerator(request)
    const windowKey = CacheKeys.rateLimit(key, this.getWindowKey())
    
    try {
      // Get current count
      const currentCount = await cacheService.incr(windowKey, this.getWindowSeconds())
      
      // Check if limit exceeded
      const allowed = currentCount <= this.options.maxRequests
      const remaining = Math.max(0, this.options.maxRequests - currentCount)
      const resetTime = Date.now() + this.options.windowMs
      
      return {
        allowed,
        remaining,
        resetTime,
        totalHits: currentCount,
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: this.options.maxRequests,
        resetTime: Date.now() + this.options.windowMs,
        totalHits: 0,
      }
    }
  }

  private getWindowKey(): string {
    const now = Date.now()
    const windowStart = Math.floor(now / this.options.windowMs)
    return windowStart.toString()
  }

  private getWindowSeconds(): number {
    return Math.ceil(this.options.windowMs / 1000)
  }

  createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.check(request)
      
      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: this.options.message,
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            },
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': this.options.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        )
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', this.options.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
      
      return null // Allow request to continue
    }
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'API rate limit exceeded. Please try again later.',
  }),

  // Authentication rate limiting
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    keyGenerator: (req) => {
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      return `auth:${ip}`
    },
    message: 'Too many authentication attempts. Please try again later.',
  }),

  // Search rate limiting
  search: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    message: 'Search rate limit exceeded. Please slow down your searches.',
  }),

  // Order creation rate limiting
  orders: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 orders per 5 minutes
    message: 'Order creation rate limit exceeded. Please wait before creating another order.',
  }),

  // Review submission rate limiting
  reviews: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 reviews per hour
    message: 'Review submission rate limit exceeded. Please wait before submitting another review.',
  }),

  // Password reset rate limiting
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset attempts per hour
    keyGenerator: (req) => {
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      return `password-reset:${ip}`
    },
    message: 'Password reset rate limit exceeded. Please try again later.',
  }),
}

// Utility function to apply rate limiting to API routes
export async function withRateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimitResponse = await limiter.createMiddleware()(request)
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  return handler()
}

// User-specific rate limiting
export class UserRateLimiter {
  private baseLimiter: RateLimiter

  constructor(baseLimiter: RateLimiter) {
    this.baseLimiter = baseLimiter
  }

  async checkForUser(userId: string, request: NextRequest) {
    const userLimiter = new RateLimiter({
      ...this.baseLimiter['options'],
      keyGenerator: () => `user:${userId}`,
    })
    
    return userLimiter.check(request)
  }
}

// IP-based rate limiting with user fallback
export class HybridRateLimiter {
  private ipLimiter: RateLimiter
  private userLimiter: UserRateLimiter

  constructor(options: RateLimitOptions) {
    this.ipLimiter = new RateLimiter(options)
    this.userLimiter = new UserRateLimiter(this.ipLimiter)
  }

  async check(request: NextRequest, userId?: string) {
    if (userId) {
      // Check user-specific limit first
      const userResult = await this.userLimiter.checkForUser(userId, request)
      if (!userResult.allowed) {
        return userResult
      }
    }
    
    // Check IP-based limit
    return this.ipLimiter.check(request)
  }
}
