import DOMPurify from 'isomorphic-dompurify'
import { isValidPhone } from './secure-validator'
import { z } from 'zod'

// Custom validation schemas
export const validationSchemas = {
  // User validation
  user: {
    email: z.string()
      .email('Invalid email format')
      .max(255, 'Email too long')
      .transform(email => email.toLowerCase().trim()),
    
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain uppercase, lowercase, number, and special character'),
    
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name too long')
      .transform(name => sanitizeHtml(name.trim())),
    
    phone: z.string()
      .optional()
      .refine(phone => !phone || isValidPhone(phone), 
        'Invalid phone number format'),
  },

  // Product validation
  product: {
    name: z.string()
      .min(2, 'Product name must be at least 2 characters')
      .max(200, 'Product name too long')
      .transform(name => sanitizeHtml(name.trim())),
    
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description too long')
      .transform(desc => sanitizeHtml(desc.trim())),
    
    price: z.number()
      .positive('Price must be positive')
      .max(999999.99, 'Price too high')
      .transform(price => Math.round(price * 100) / 100), // Round to 2 decimal places
    
    stock: z.number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .max(999999, 'Stock too high'),
    
    sku: z.string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU too long')
      .regex(/^[A-Z0-9-_]+$/, 'SKU can only contain uppercase letters, numbers, hyphens, and underscores')
      .transform(sku => sku.toUpperCase().trim()),
    
    slug: z.string()
      .min(3, 'Slug must be at least 3 characters')
      .max(100, 'Slug too long')
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
      .transform(slug => slug.toLowerCase().trim()),
  },

  // Order validation
  order: {
    shippingAddress: z.object({
      street: z.string().min(5, 'Street address too short').max(200, 'Street address too long'),
      city: z.string().min(2, 'City name too short').max(100, 'City name too long'),
      state: z.string().min(2, 'State too short').max(100, 'State too long'),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
      country: z.string().min(2, 'Country code too short').max(2, 'Country code too long'),
    }).transform(addr => ({
      ...addr,
      street: sanitizeHtml(addr.street.trim()),
      city: sanitizeHtml(addr.city.trim()),
      state: sanitizeHtml(addr.state.trim()),
    })),
    
    billingAddress: z.object({
      street: z.string().min(5, 'Street address too short').max(200, 'Street address too long'),
      city: z.string().min(2, 'City name too short').max(100, 'City name too long'),
      state: z.string().min(2, 'State too short').max(100, 'State too long'),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
      country: z.string().min(2, 'Country code too short').max(2, 'Country code too long'),
    }).transform(addr => ({
      ...addr,
      street: sanitizeHtml(addr.street.trim()),
      city: sanitizeHtml(addr.city.trim()),
      state: sanitizeHtml(addr.state.trim()),
    })),
  },

  // Review validation
  review: {
    rating: z.number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(200, 'Title too long')
      .transform(title => sanitizeHtml(title.trim())),
    
    content: z.string()
      .min(10, 'Content must be at least 10 characters')
      .max(2000, 'Content too long')
      .transform(content => sanitizeHtml(content.trim())),
  },

  // Search validation
  search: {
    query: z.string()
      .min(1, 'Search query cannot be empty')
      .max(100, 'Search query too long')
      .transform(query => sanitizeHtml(query.trim())),
    
    page: z.string()
      .optional()
      .transform(page => {
        const num = parseInt(page || '1')
        return Math.max(1, Math.min(1000, num)) // Limit to 1-1000
      }),
    
    limit: z.string()
      .optional()
      .transform(limit => {
        const num = parseInt(limit || '20')
        return Math.max(1, Math.min(100, num)) // Limit to 1-100
      }),
  },

  // File upload validation
  file: {
    image: z.object({
      size: z.number().max(5 * 1024 * 1024, 'Image size cannot exceed 5MB'),
      type: z.string().refine(
        type => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
        'Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed'
      ),
      name: z.string()
        .min(1, 'Filename required')
        .max(255, 'Filename too long')
        .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters'),
    }),
  },
}

// Sanitization functions
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove potentially dangerous HTML tags and attributes
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return ''
  
  // Remove dangerous characters and limit length
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return ''
  
  // Validate and sanitize URL
  try {
    const parsedUrl = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return ''
    }
    return parsedUrl.toString()
  } catch {
    return ''
  }
}

// SQL injection prevention
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove SQL injection patterns
  return input
    .replace(/['"`;\\]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment starts
    .replace(/\*\//g, '') // Remove block comment ends
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
}

// XSS prevention
export function preventXSS(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const request = args[0]
      
      try {
        // Extract body from request
        const body = await request.json()
        
        // Validate input
        const validatedData = schema.parse(body)
        
        // Replace original body with validated data
        args[0] = { ...request, validatedBody: validatedData }
        
        return originalMethod.apply(this, args)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: error.issues,
              },
            }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          )
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Validation failed',
            },
          }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return descriptor
  }
}

// Query parameter validation
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const request = args[0]
      
      try {
        // Extract query parameters
        const url = new URL(request.url)
        const queryParams = Object.fromEntries(url.searchParams.entries())
        
        // Validate query parameters
        const validatedParams = schema.parse(queryParams)
        
        // Add validated params to request
        args[0] = { ...request, validatedQuery: validatedParams }
        
        return originalMethod.apply(this, args)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid query parameters',
                details: error.issues,
              },
            }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          )
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Query validation failed',
            },
          }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return descriptor
  }
}

// Rate limiting for validation attempts
export function validateWithRateLimit(
  schema: z.ZodSchema<any>,
  rateLimiter: any
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const request = args[0]
      
      // Check rate limit first
      const rateLimitResponse = await rateLimiter.createMiddleware()(request)
      if (rateLimitResponse) {
        return rateLimitResponse
      }
      
      // Then validate input
      try {
        const body = await request.json()
        const validatedData = schema.parse(body)
        args[0] = { ...request, validatedBody: validatedData }
        
        return originalMethod.apply(this, args)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: error.issues,
              },
            }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          )
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Validation failed',
            },
          }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return descriptor
  }
}

export default validationSchemas
