import { PERMISSIONS, RBACService, ROLES } from '@/lib/rbac'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/redis', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  CacheKeys: {
    userPermissions: (userId: string) => `permissions:${userId}`,
  },
  CacheTTL: {
    MEDIUM: 1800,
  },
}))

describe('RBAC Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue([
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_WRITE,
      ])

      const result = await RBACService.hasPermission('user-123', PERMISSIONS.PRODUCT_READ)

      expect(result).toBe(true)
    })

    it('should return false when user lacks permission', async () => {
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue([
        PERMISSIONS.PRODUCT_READ,
      ])

      const result = await RBACService.hasPermission('user-123', PERMISSIONS.PRODUCT_DELETE)

      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockRejectedValue(new Error('Cache error'))

      const result = await RBACService.hasPermission('user-123', PERMISSIONS.PRODUCT_READ)

      expect(result).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true when user has any of the permissions', async () => {
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue([
        PERMISSIONS.PRODUCT_READ,
      ])

      const result = await RBACService.hasAnyPermission('user-123', [
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_DELETE,
      ])

      expect(result).toBe(true)
    })

    it('should return false when user has none of the permissions', async () => {
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue([
        PERMISSIONS.PRODUCT_READ,
      ])

      const result = await RBACService.hasAnyPermission('user-123', [
        PERMISSIONS.PRODUCT_DELETE,
        PERMISSIONS.SYSTEM_ADMIN,
      ])

      expect(result).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue([
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_WRITE,
        PERMISSIONS.PRODUCT_DELETE,
      ])

      const result = await RBACService.hasAllPermissions('user-123', [
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_WRITE,
      ])

      expect(result).toBe(true)
    })

    it('should return false when user lacks any permission', async () => {
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue([
        PERMISSIONS.PRODUCT_READ,
      ])

      const result = await RBACService.hasAllPermissions('user-123', [
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_DELETE,
      ])

      expect(result).toBe(false)
    })
  })

  describe('getUserRole', () => {
    it('should return user role', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN',
      })

      const result = await RBACService.getUserRole('user-123')

      expect(result).toBe('ADMIN')
    })

    it('should return null when user not found', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await RBACService.getUserRole('user-123')

      expect(result).toBeNull()
    })
  })

  describe('getUserPermissions', () => {
    it('should return cached permissions', async () => {
      const { cacheService } = require('@/lib/redis')
      
      const cachedPermissions = [PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_WRITE]
      cacheService.get.mockResolvedValue(cachedPermissions)

      const result = await RBACService.getUserPermissions('user-123')

      expect(result).toEqual(cachedPermissions)
    })

    it('should fetch permissions from database when not cached', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue(null)
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN',
      })
      cacheService.set.mockResolvedValue(undefined)

      const result = await RBACService.getUserPermissions('user-123')

      expect(result).toEqual(ROLES.ADMIN.permissions)
      expect(cacheService.set).toHaveBeenCalled()
    })

    it('should return empty array when user has no role', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue(null)
      prisma.user.findUnique.mockResolvedValue({
        role: null,
      })

      const result = await RBACService.getUserPermissions('user-123')

      expect(result).toEqual([])
    })
  })

  describe('updateUserRole', () => {
    it('should update user role when updater has permission', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')
      
      // Mock hasPermission to return true
      jest.spyOn(RBACService, 'hasPermission').mockResolvedValue(true)
      
      prisma.user.update.mockResolvedValue({})
      prisma.auditLog.create.mockResolvedValue({})
      cacheService.del.mockResolvedValue(undefined)

      const result = await RBACService.updateUserRole('user-123', 'ADMIN', 'admin-456')

      expect(result).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { role: 'ADMIN' },
      })
    })

    it('should reject role update when updater lacks permission', async () => {
      jest.spyOn(RBACService, 'hasPermission').mockResolvedValue(false)

      const result = await RBACService.updateUserRole('user-123', 'ADMIN', 'user-456')

      expect(result).toBe(false)
    })
  })

  describe('isResourceOwner', () => {
    it('should return true for order owner', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.order.findUnique.mockResolvedValue({
        userId: 'user-123',
      })

      const result = await RBACService.isResourceOwner('user-123', 'order', 'order-456')

      expect(result).toBe(true)
    })

    it('should return false for non-order owner', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.order.findUnique.mockResolvedValue({
        userId: 'user-456',
      })

      const result = await RBACService.isResourceOwner('user-123', 'order', 'order-456')

      expect(result).toBe(false)
    })

    it('should return true for user resource when IDs match', async () => {
      const result = await RBACService.isResourceOwner('user-123', 'user', 'user-123')

      expect(result).toBe(true)
    })

    it('should return false for user resource when IDs do not match', async () => {
      const result = await RBACService.isResourceOwner('user-123', 'user', 'user-456')

      expect(result).toBe(false)
    })
  })

  describe('canAccessResource', () => {
    it('should allow access for system admin', async () => {
      jest.spyOn(RBACService, 'hasPermission').mockResolvedValue(true)

      const result = await RBACService.canAccessResource(
        'user-123',
        'order',
        'order-456',
        'read'
      )

      expect(result).toBe(true)
    })

    it('should allow access when user has required permission', async () => {
      jest.spyOn(RBACService, 'hasPermission')
        .mockResolvedValueOnce(false) // Not system admin
        .mockResolvedValueOnce(true)  // Has order read permission

      const result = await RBACService.canAccessResource(
        'user-123',
        'order',
        'order-456',
        'read'
      )

      expect(result).toBe(true)
    })

    it('should allow read access for resource owner', async () => {
      jest.spyOn(RBACService, 'hasPermission')
        .mockResolvedValueOnce(false) // Not system admin
        .mockResolvedValueOnce(false) // No order read permission
      jest.spyOn(RBACService, 'isResourceOwner').mockResolvedValue(true)

      const result = await RBACService.canAccessResource(
        'user-123',
        'order',
        'order-456',
        'read'
      )

      expect(result).toBe(true)
    })

    it('should deny access when user lacks permission and is not owner', async () => {
      jest.spyOn(RBACService, 'hasPermission')
        .mockResolvedValueOnce(false) // Not system admin
        .mockResolvedValueOnce(false) // No order read permission
      jest.spyOn(RBACService, 'isResourceOwner').mockResolvedValue(false)

      const result = await RBACService.canAccessResource(
        'user-123',
        'order',
        'order-456',
        'read'
      )

      expect(result).toBe(false)
    })
  })

  describe('getAllRoles', () => {
    it('should return all available roles', () => {
      const result = RBACService.getAllRoles()

      expect(result).toHaveLength(4)
      expect(result.map(r => r.name)).toEqual(['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'])
    })
  })

  describe('getAllPermissions', () => {
    it('should return all available permissions', () => {
      const result = RBACService.getAllPermissions()

      expect(result).toContain(PERMISSIONS.USER_READ)
      expect(result).toContain(PERMISSIONS.PRODUCT_WRITE)
      expect(result).toContain(PERMISSIONS.SYSTEM_ADMIN)
    })
  })
})
