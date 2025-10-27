import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'

// Security headers configuration
export const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://www.google-analytics.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

// CSRF token management
export class CSRFService {
  private static instance: CSRFService
  private tokens: Map<string, { token: string; expires: number }> = new Map()

  private constructor() {}

  public static getInstance(): CSRFService {
    if (!CSRFService.instance) {
      CSRFService.instance = new CSRFService()
    }
    return CSRFService.instance
  }

  // Generate CSRF token
  generateToken(sessionId: string): string {
    const token = nanoid(32)
    const expires = Date.now() + (2 * 60 * 60 * 1000) // 2 hours
    
    this.tokens.set(sessionId, { token, expires })
    
    // Clean up expired tokens
    this.cleanupExpiredTokens()
    
    return token
  }

  // Verify CSRF token
  verifyToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    
    if (!stored || stored.expires < Date.now()) {
      this.tokens.delete(sessionId)
      return false
    }
    
    return stored.token === token
  }

  // Remove CSRF token
  removeToken(sessionId: string): void {
    this.tokens.delete(sessionId)
  }

  // Clean up expired tokens
  private cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [sessionId, data] of this.tokens.entries()) {
      if (data.expires < now) {
        this.tokens.delete(sessionId)
      }
    }
  }
}

// Security middleware
export function withSecurityHeaders(_handler: any) {
  return async (request: NextRequest, context: any) => {
    const response = await _handler(request, context)
    
    // Add security headers to response
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
}

// CSRF protection middleware
export function withCSRFProtection(_handler: any) {
  return async (request: NextRequest, context: any) => {
    // Skip CSRF check for GET requests and safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return _handler(request, context)
    }
    
    // Skip CSRF check for API routes that don't need it
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/auth/') || 
        url.pathname.startsWith('/api/webhooks/')) {
      return _handler(request, context)
    }
    
    const csrfService = CSRFService.getInstance()
    
    // Get session ID from request
    const sessionId = request.headers.get('x-session-id') || 
                     request.cookies.get('session-id')?.value
    
    if (!sessionId) {
      return new NextResponse(
        JSON.stringify({ error: 'Session required for CSRF protection' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Get CSRF token from request
    const csrfToken = request.headers.get('x-csrf-token') ||
                     request.headers.get('csrf-token')
    
    if (!csrfToken) {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF token required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Verify CSRF token
    if (!csrfService.verifyToken(sessionId, csrfToken)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return _handler(request, context)
  }
}

// Request sanitization middleware
export function withRequestSanitization(_handler: any) {
  return async (request: NextRequest, context: any) => {
    // Sanitize request headers
    const sanitizedHeaders = new Headers()
    for (const [key, value] of request.headers.entries()) {
      // Remove potentially dangerous headers
      if (key.toLowerCase().startsWith('x-') && 
          !['x-csrf-token', 'x-session-id', 'x-forwarded-for'].includes(key.toLowerCase())) {
        continue
      }
      
      // Sanitize header values
      const sanitizedValue = value.replace(/[<>\"'&]/g, '')
      sanitizedHeaders.set(key, sanitizedValue)
    }
    
    // Create sanitized request
    const sanitizedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: sanitizedHeaders,
      body: request.body,
    })
    
    return _handler(sanitizedRequest, context)
  }
}

// IP whitelist middleware
export function withIPWhitelist(allowedIPs: string[]) {
  return function (handler: any) {
    return async (request: NextRequest, context: any) => {
      const clientIP = getClientIP(request)
      
      if (!allowedIPs.includes(clientIP)) {
        return new NextResponse(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      return handler(request, context)
    }
  }
}

// Request size limiting middleware
export function withSizeLimit(_maxSize: number) {
  return function (handler: any) {
    return async (request: NextRequest, context: any) => {
      const contentLength = request.headers.get('content-length')
      
      if (contentLength && parseInt(contentLength) > _maxSize) {
        return new NextResponse(
          JSON.stringify({ error: 'Request too large' }),
          { status: 413, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      return handler(request, context)
    }
  }
}

// Security audit logging
export function withSecurityAudit(_handler: any) {
  return async (request: NextRequest, context: any) => {
    const startTime = Date.now()
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    try {
      const response = await _handler(request, context)
      
      // Log successful request
      console.log(`[SECURITY] ${request.method} ${request.url} - ${response.status} - ${clientIP} - ${Date.now() - startTime}ms`)
      
      return response
    } catch (error) {
      // Log failed request
      console.error(`[SECURITY] ${request.method} ${request.url} - ERROR - ${clientIP} - ${userAgent} - ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      throw error
    }
  }
}

// Utility function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return '127.0.0.1'
}

// Security configuration for different environments
export const SECURITY_CONFIG = {
  development: {
    csp: "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    hsts: false,
    csrf: false,
  },
  production: {
    csp: SECURITY_HEADERS['Content-Security-Policy'],
    hsts: true,
    csrf: true,
  },
  staging: {
    csp: SECURITY_HEADERS['Content-Security-Policy'],
    hsts: false,
    csrf: true,
  },
}

export default SECURITY_HEADERS
