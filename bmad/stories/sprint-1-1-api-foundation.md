# Story: API Infrastructure Foundation

## Epic Context
- **Epic:** Backend Infrastructure Implementation
- **Priority:** High (Critical Path)
- **Estimated Effort:** 5 Story Points
- **Dependencies:** Database Infrastructure Foundation
- **Blockers:** None (can start after database setup)

## Requirements Context
**From Architecture Analysis:**
- Current state: No API routes, static data in components
- Required: RESTful API endpoints for all e-commerce functionality
- Architecture: Next.js API routes with proper error handling
- Integration: Database operations through Prisma client

**Business Requirements:**
- Product catalog API endpoints
- User management API endpoints
- Shopping cart API endpoints
- Order processing API endpoints
- Admin management API endpoints

## Architecture Context
**Technical Specifications:**
- **Framework:** Next.js API routes
- **Database:** Prisma client integration
- **Validation:** Zod schema validation
- **Error Handling:** Centralized error handling
- **Response Format:** Consistent JSON responses

**API Design Principles:**
- RESTful design with clear resource hierarchy
- Consistent response formats across all endpoints
- Proper HTTP status codes
- Input validation and sanitization
- Rate limiting and security headers

## Implementation Details

### 1. API Route Structure
```
api/
├── auth/                    # Authentication endpoints
│   ├── signup.ts
│   ├── signin.ts
│   └── session.ts
├── products/               # Product management
│   ├── index.ts
│   ├── [id].ts
│   └── search.ts
├── users/                  # User management
│   ├── index.ts
│   └── [id].ts
├── cart/                   # Shopping cart
│   ├── index.ts
│   └── items/
│       └── [id].ts
├── orders/                 # Order management
│   ├── index.ts
│   └── [id].ts
└── admin/                  # Admin operations
    ├── dashboard.ts
    └── analytics.ts
```

### 2. Base API Utilities
```typescript
// lib/api-utils.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export const createApiHandler = <T>(
  handler: (req: NextApiRequest, res: NextApiResponse<ApiResponse<T>>) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse<T>>) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error('API Error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred'
        }
      })
    }
  }
}

export const validateRequest = <T>(
  schema: z.ZodSchema<T>,
  data: any
): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    throw new Error(`Validation error: ${error}`)
  }
}
```

### 3. Products API Implementation
```typescript
// pages/api/products/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createApiHandler, ApiResponse } from '@/lib/api-utils'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'price', 'createdAt']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc')
})

const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
  if (req.method === 'GET') {
    const { page, limit, category, search, sort, order } = validateRequest(
      querySchema,
      req.query
    )

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sort]: order },
        include: {
          category: true,
          variants: true,
          _count: { select: { reviews: true } }
        }
      }),
      prisma.product.count({ where })
    ])

    res.status(200).json({
      success: true,
      data: products,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`
      }
    })
  }
}

export default createApiHandler(handler)
```

### 4. Product Detail API
```typescript
// pages/api/products/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createApiHandler, ApiResponse } from '@/lib/api-utils'

const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
  const { id } = req.query

  if (req.method === 'GET') {
    const product = await prisma.product.findUnique({
      where: { id: id as string },
      include: {
        category: true,
        variants: true,
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { reviews: true } }
      }
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        }
      })
    }

    res.status(200).json({
      success: true,
      data: product
    })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`
      }
    })
  }
}

export default createApiHandler(handler)
```

### 5. Cart API Implementation
```typescript
// pages/api/cart/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createApiHandler, ApiResponse } from '@/lib/api-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    })
  }

  if (req.method === 'GET') {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: { category: true }
        },
        variant: true
      }
    })

    res.status(200).json({
      success: true,
      data: cartItems
    })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`
      }
    })
  }
}

export default createApiHandler(handler)
```

### 6. Error Handling Middleware
```typescript
// lib/error-handler.ts
import { NextApiRequest, NextApiResponse } from 'next'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const handleApiError = (
  error: any,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    })
  }

  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this information already exists'
      }
    })
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred'
    }
  })
}
```

## Acceptance Criteria

### API Infrastructure
- [ ] API route structure implemented
- [ ] Base API utilities created
- [ ] Error handling middleware implemented
- [ ] Response format standardization
- [ ] Input validation with Zod schemas

### Core API Endpoints
- [ ] Products API (GET /api/products, GET /api/products/[id])
- [ ] Product search API (GET /api/products/search)
- [ ] Categories API (GET /api/categories)
- [ ] Cart API (GET /api/cart, POST /api/cart/items)
- [ ] User API (GET /api/users/[id])

### API Features
- [ ] Pagination support for list endpoints
- [ ] Search and filtering capabilities
- [ ] Sorting and ordering options
- [ ] Proper HTTP status codes
- [ ] Consistent error responses

### Integration
- [ ] Database integration through Prisma
- [ ] Authentication integration (where required)
- [ ] Input validation and sanitization
- [ ] Rate limiting implementation
- [ ] CORS configuration

### Testing
- [ ] Unit tests for API utilities
- [ ] Integration tests for API endpoints
- [ ] Error handling tests
- [ ] Validation tests
- [ ] Performance tests

## Testing Requirements

### Unit Tests
```typescript
// tests/api/utils.test.ts
import { validateRequest } from '@/lib/api-utils'
import { z } from 'zod'

describe('API Utils', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number()
  })

  it('should validate correct data', () => {
    const data = { name: 'John', age: 30 }
    const result = validateRequest(schema, data)
    expect(result).toEqual(data)
  })

  it('should throw error for invalid data', () => {
    const data = { name: 'John', age: 'invalid' }
    expect(() => validateRequest(schema, data)).toThrow()
  })
})
```

### Integration Tests
```typescript
// tests/api/products.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/products'

describe('/api/products', () => {
  it('should return products with pagination', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.meta).toBeDefined()
  })
})
```

## Definition of Done
- [ ] API route structure implemented
- [ ] Core API endpoints functional
- [ ] Error handling middleware implemented
- [ ] Input validation with Zod schemas
- [ ] Database integration through Prisma
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests implemented
- [ ] API documentation updated
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Security headers implemented
- [ ] Rate limiting configured

## Notes and Context

### Implementation Order
1. **Base Infrastructure** - API utilities and error handling
2. **Core Endpoints** - Products, categories, users
3. **Shopping Features** - Cart, wishlist endpoints
4. **Admin Endpoints** - Admin-specific operations
5. **Testing** - Comprehensive test coverage

### Dependencies
- Database infrastructure completed
- Prisma client available
- Authentication system (for protected endpoints)
- Environment variables configured

### Security Considerations
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration
- Authentication for protected endpoints
- SQL injection prevention through Prisma

### Performance Considerations
- Database query optimization
- Response caching where appropriate
- Pagination for large datasets
- Efficient data loading with Prisma includes

---

**This story provides complete context for implementing the API infrastructure foundation, including technical specifications, implementation details, testing requirements, and success criteria.**
