# Story: Database Infrastructure Foundation

## Epic Context
- **Epic:** Backend Infrastructure Implementation
- **Priority:** High (Critical Path)
- **Estimated Effort:** 8 Story Points
- **Dependencies:** None (Foundation story)
- **Blockers:** None

## Requirements Context
**From Architecture Analysis:**
- Current state: No database integration, static data in components
- Required: Complete database infrastructure with Prisma ORM
- Database: PostgreSQL 16.x with Redis 7.2.x for caching
- Schema: Comprehensive e-commerce schema with 15+ models

**Business Requirements:**
- Support user management and authentication
- Handle product catalog with variants and inventory
- Process orders and payments
- Track analytics and reporting
- Support admin operations

## Architecture Context
**Technical Specifications:**
- **Database:** PostgreSQL 16.x with Prisma ORM
- **Cache:** Redis 7.2.x for session and API caching
- **Schema Location:** `database/schema.prisma`
- **Migration Strategy:** Prisma migrations with seeding
- **Connection:** Environment-based configuration

**Integration Points:**
- NextAuth.js for authentication
- Stripe for payment processing
- Email services for notifications
- Analytics for reporting

## Implementation Details

### 1. Prisma ORM Setup
```bash
# Install Prisma dependencies
pnpm add prisma @prisma/client
pnpm add -D prisma

# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate
```

### 2. Database Configuration
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Database Schema Implementation
- **User Management:** User, Address, UserRole models
- **Product Catalog:** Product, Category, ProductVariant models
- **Shopping:** CartItem, WishlistItem models
- **Orders:** Order, OrderItem, Payment models
- **Reviews:** Review model
- **Inventory:** Inventory, InventoryTransaction models
- **Analytics:** Analytics model
- **System:** Setting, Notification models

### 4. Database Connection Setup
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 5. Redis Setup
```typescript
// lib/redis.ts
import { createClient } from 'redis'

export const redis = createClient({
  url: process.env.REDIS_URL
})

redis.on('error', (err) => console.log('Redis Client Error', err))
redis.connect()
```

### 6. Database Seeding
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories'
    }
  })

  // Seed products
  await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High-quality wireless headphones',
        price: 99.99,
        sku: 'WH-001',
        categoryId: electronics.id,
        images: ['/images/headphones.jpg'],
        quantity: 50
      }
    ]
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Acceptance Criteria

### Database Setup
- [ ] Prisma ORM installed and configured
- [ ] PostgreSQL database connected and accessible
- [ ] Redis cache connected and operational
- [ ] Database schema deployed successfully
- [ ] Prisma client generated and working

### Schema Implementation
- [ ] All 15+ models implemented in schema.prisma
- [ ] Relationships between models properly defined
- [ ] Indexes added for performance optimization
- [ ] Constraints and validations implemented
- [ ] Migration files generated and applied

### Connection & Configuration
- [ ] Database connection established in both client and admin apps
- [ ] Environment variables properly configured
- [ ] Connection pooling implemented
- [ ] Error handling for database operations
- [ ] Redis connection established and tested

### Data Seeding
- [ ] Seed script created and functional
- [ ] Sample data for all major entities
- [ ] Admin user created for testing
- [ ] Product catalog populated
- [ ] Categories and variants seeded

### Testing
- [ ] Database connection tests passing
- [ ] Schema validation tests implemented
- [ ] CRUD operation tests for all models
- [ ] Redis cache tests implemented
- [ ] Integration tests with API routes

## Testing Requirements

### Unit Tests
```typescript
// tests/database/connection.test.ts
import { prisma } from '@/lib/prisma'

describe('Database Connection', () => {
  it('should connect to database', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow()
  })

  it('should perform basic query', async () => {
    const userCount = await prisma.user.count()
    expect(userCount).toBeGreaterThanOrEqual(0)
  })
})
```

### Integration Tests
```typescript
// tests/database/schema.test.ts
import { prisma } from '@/lib/prisma'

describe('Database Schema', () => {
  it('should create user with address', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        address: {
          create: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
          }
        }
      },
      include: { address: true }
    })

    expect(user.address).toBeDefined()
    expect(user.address.street).toBe('123 Main St')
  })
})
```

### Performance Tests
```typescript
// tests/database/performance.test.ts
describe('Database Performance', () => {
  it('should handle concurrent connections', async () => {
    const promises = Array.from({ length: 10 }, () => 
      prisma.user.findMany()
    )
    
    const results = await Promise.all(promises)
    expect(results).toHaveLength(10)
  })
})
```

## Definition of Done
- [ ] Prisma ORM installed and configured
- [ ] Database schema implemented with all models
- [ ] Database connection established in both apps
- [ ] Redis cache connected and operational
- [ ] Seed script created and executed
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests implemented
- [ ] Performance tests passing
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Migration files applied successfully

## Notes and Context

### Implementation Order
1. **Setup Prisma** - Install and configure Prisma ORM
2. **Database Connection** - Establish PostgreSQL connection
3. **Schema Implementation** - Deploy complete database schema
4. **Redis Setup** - Configure Redis for caching
5. **Seeding** - Create and run seed script
6. **Testing** - Implement comprehensive tests

### Dependencies
- PostgreSQL 16.x running and accessible
- Redis 7.2.x running and accessible
- Environment variables configured
- Node.js 20.x with pnpm

### Risk Mitigation
- **Database Performance:** Use connection pooling and indexes
- **Data Loss:** Backup strategy and migration rollback
- **Connection Issues:** Proper error handling and retry logic
- **Schema Changes:** Version-controlled migrations

### Success Criteria
- Database operations working in both client and admin apps
- All models accessible through Prisma client
- Redis caching operational
- Test coverage > 80%
- Performance benchmarks met

---

**This story provides complete context for implementing the database infrastructure foundation, including technical specifications, implementation details, testing requirements, and success criteria.**
