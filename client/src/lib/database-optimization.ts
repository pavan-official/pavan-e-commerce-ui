import { prisma } from '@/lib/prisma'

// Database optimization utilities
export class DatabaseOptimizer {
  // Add database indexes for better performance
  static async createIndexes() {
    try {
      console.log('🔧 Creating database indexes...')
      
      // Note: In production, these would be handled by Prisma migrations
      // This is for demonstration and development setup
      
      const indexes = [
        // User indexes
        'CREATE INDEX IF NOT EXISTS idx_users_email ON "User" (email)',
        'CREATE INDEX IF NOT EXISTS idx_users_created_at ON "User" (created_at)',
        'CREATE INDEX IF NOT EXISTS idx_users_role ON "User" (role)',
        
        // Product indexes
        'CREATE INDEX IF NOT EXISTS idx_products_category_id ON "Product" (category_id)',
        'CREATE INDEX IF NOT EXISTS idx_products_price ON "Product" (price)',
        'CREATE INDEX IF NOT EXISTS idx_products_stock ON "Product" (stock)',
        'CREATE INDEX IF NOT EXISTS idx_products_is_active ON "Product" (is_active)',
        'CREATE INDEX IF NOT EXISTS idx_products_is_featured ON "Product" (is_featured)',
        'CREATE INDEX IF NOT EXISTS idx_products_created_at ON "Product" (created_at)',
        'CREATE INDEX IF NOT EXISTS idx_products_name_search ON "Product" USING gin(to_tsvector(\'english\', name))',
        'CREATE INDEX IF NOT EXISTS idx_products_description_search ON "Product" USING gin(to_tsvector(\'english\', description))',
        
        // Order indexes
        'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON "Order" (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_orders_status ON "Order" (status)',
        'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON "Order" (payment_status)',
        'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON "Order" (created_at)',
        'CREATE INDEX IF NOT EXISTS idx_orders_order_number ON "Order" (order_number)',
        
        // Order item indexes
        'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "OrderItem" (order_id)',
        'CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON "OrderItem" (product_id)',
        'CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON "OrderItem" (variant_id)',
        
        // Review indexes
        'CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON "Review" (product_id)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON "Review" (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON "Review" (rating)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON "Review" (is_approved)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON "Review" (created_at)',
        
        // Cart item indexes
        'CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON "CartItem" (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON "CartItem" (product_id)',
        
        // Wishlist item indexes
        'CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON "WishlistItem" (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON "WishlistItem" (product_id)',
        
        // Notification indexes
        'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "Notification" (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_type ON "Notification" (type)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON "Notification" (is_read)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "Notification" (created_at)',
        
        // Payment indexes
        'CREATE INDEX IF NOT EXISTS idx_payments_order_id ON "Payment" (order_id)',
        'CREATE INDEX IF NOT EXISTS idx_payments_status ON "Payment" (status)',
        'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON "Payment" (created_at)',
      ]
      
      for (const indexQuery of indexes) {
        try {
          await prisma.$executeRawUnsafe(indexQuery)
        } catch (_error) {
          console.warn(`Index creation warning: ${_error}`)
        }
      }
      
      console.log('✅ Database indexes created successfully')
    } catch (_error) {
      console.error('❌ Error creating database indexes:', _error)
    }
  }

  // Optimize database queries
  static async optimizeQueries() {
    try {
      console.log('🔧 Optimizing database queries...')
      
      // Update table statistics for better query planning
      await prisma.$executeRawUnsafe('ANALYZE')
      
      console.log('✅ Database queries optimized')
    } catch (_error) {
      console.error('❌ Error optimizing database queries:', _error)
    }
  }

  // Clean up old data
  static async cleanupOldData() {
    try {
      console.log('🧹 Cleaning up old data...')
      
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      // Clean up old notifications (older than 30 days)
      const deletedNotifications = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          isRead: true,
        },
      })
      
      // Clean up old sessions (older than 7 days)
      const deletedSessions = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: sevenDaysAgo,
          },
        },
      })
      
      console.log(`✅ Cleaned up ${deletedNotifications.count} old notifications and ${deletedSessions.count} old sessions`)
    } catch (_error) {
      console.error('❌ Error cleaning up old data:', _error)
    }
  }

  // Get database performance metrics
  static async getPerformanceMetrics() {
    try {
      const [
        tableStats,
        indexStats,
        connectionStats,
      ] = await Promise.all([
        // Table statistics
        prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
          FROM pg_stat_user_tables
          ORDER BY n_live_tup DESC
        `,
        
        // Index statistics
        prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched,
            idx_scan as scans
          FROM pg_stat_user_indexes
          WHERE idx_scan > 0
          ORDER BY idx_scan DESC
        `,
        
        // Connection statistics
        prisma.$queryRaw`
          SELECT 
            state,
            count(*) as count
          FROM pg_stat_activity
          GROUP BY state
        `,
      ])
      
      return {
        tables: tableStats,
        indexes: indexStats,
        connections: connectionStats,
      }
    } catch (_error) {
      console.error('❌ Error getting performance metrics:', _error)
      return null
    }
  }

  // Vacuum and analyze database
  static async vacuumAndAnalyze() {
    try {
      console.log('🔧 Running database maintenance...')
      
      await prisma.$executeRawUnsafe('VACUUM ANALYZE')
      
      console.log('✅ Database maintenance completed')
    } catch (_error) {
      console.error('❌ Error running database maintenance:', _error)
    }
  }

  // Check database health
  static async checkHealth() {
    try {
      const [
        connectionTest,
        queryTest,
        indexTest,
      ] = await Promise.all([
        // Test database connection
        prisma.$queryRaw`SELECT 1 as test`,
        
        // Test basic query performance
        prisma.user.count(),
        
        // Test index usage
        prisma.$queryRaw`
          SELECT count(*) as count
          FROM "Product" 
          WHERE is_active = true 
          AND price > 0
        `,
      ])
      
      return {
        healthy: true,
        connection: connectionTest,
        queryPerformance: queryTest,
        indexUsage: indexTest,
        timestamp: new Date().toISOString(),
      }
    } catch (_error) {
      console.error('❌ Database health check failed:', _error)
      return {
        healthy: false,
        error: _error instanceof Error ? _error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  }
}

// Query optimization helpers
export class QueryOptimizer {
  // Optimize product queries with proper includes
  static getOptimizedProductQuery(includeReviews = false) {
    const baseInclude = {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    }

    if (includeReviews) {
      return {
        ...baseInclude,
        reviews: {
          where: {
            isApproved: true,
          },
          select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            reviews: {
              where: {
                isApproved: true,
              },
            },
          },
        },
      }
    }

    return baseInclude
  }

  // Optimize order queries
  static getOptimizedOrderQuery() {
    return {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              thumbnail: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              attributes: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          createdAt: true,
        },
      },
    }
  }

  // Optimize user queries
  static getOptimizedUserQuery() {
    return {
      _count: {
        select: {
          orders: true,
          reviews: true,
        },
      },
    }
  }
}

// Database connection pool optimization
export class ConnectionPoolOptimizer {
  static getOptimalPoolConfig() {
    return {
      // Connection pool settings
      connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
      acquireTimeoutMillis: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60000'),
      timeout: parseInt(process.env.DATABASE_TIMEOUT || '60000'),
      
      // Query settings
      queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
      
      // Transaction settings
      transactionTimeout: parseInt(process.env.DATABASE_TRANSACTION_TIMEOUT || '60000'),
    }
  }
}
