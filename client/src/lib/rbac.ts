import { prisma } from '@/lib/prisma'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/redis'
import { getServerUser } from '@/lib/custom-auth'

// Permission definitions
export const PERMISSIONS = {
  // User permissions
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // Product permissions
  PRODUCT_READ: 'product:read',
  PRODUCT_WRITE: 'product:write',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_MANAGE: 'product:manage',
  
  // Order permissions
  ORDER_READ: 'order:read',
  ORDER_WRITE: 'order:write',
  ORDER_DELETE: 'order:delete',
  ORDER_MANAGE: 'order:manage',
  
  // Category permissions
  CATEGORY_READ: 'category:read',
  CATEGORY_WRITE: 'category:write',
  CATEGORY_DELETE: 'category:delete',
  
  // Review permissions
  REVIEW_READ: 'review:read',
  REVIEW_WRITE: 'review:write',
  REVIEW_DELETE: 'review:delete',
  REVIEW_MODERATE: 'review:moderate',
  
  // Analytics permissions
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs',
} as const

// Role definitions with permissions
export const ROLES: Record<string, { name: string; permissions: string[] }> = {
  USER: {
    name: 'USER',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_WRITE,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.REVIEW_READ,
      PERMISSIONS.REVIEW_WRITE,
    ],
  },
  MODERATOR: {
    name: 'MODERATOR',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_WRITE,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.REVIEW_READ,
      PERMISSIONS.REVIEW_WRITE,
      PERMISSIONS.REVIEW_MODERATE,
      PERMISSIONS.ANALYTICS_READ,
    ],
  },
  ADMIN: {
    name: 'ADMIN',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_WRITE,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.REVIEW_READ,
      PERMISSIONS.REVIEW_WRITE,
      PERMISSIONS.REVIEW_MODERATE,
      PERMISSIONS.ANALYTICS_READ,
      PERMISSIONS.USER_WRITE,
      PERMISSIONS.PRODUCT_WRITE,
      PERMISSIONS.PRODUCT_DELETE,
      PERMISSIONS.ORDER_MANAGE,
      PERMISSIONS.CATEGORY_WRITE,
      PERMISSIONS.CATEGORY_DELETE,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.SYSTEM_CONFIG,
    ],
  },
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    permissions: Object.values(PERMISSIONS),
  },
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
export type Role = keyof typeof ROLES

export class RBACService {
  // Check if user has specific permission
  static async hasPermission(
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      return userPermissions.includes(permission)
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  // Check if user has any of the specified permissions
  static async hasAnyPermission(
    userId: string,
    permissions: Permission[]
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      return permissions.some(permission => userPermissions.includes(permission))
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }

  // Check if user has all of the specified permissions
  static async hasAllPermissions(
    userId: string,
    permissions: Permission[]
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      return permissions.every(permission => userPermissions.includes(permission))
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }

  // Get user's role
  static async getUserRole(userId: string): Promise<Role | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      return user?.role as Role || null
    } catch (error) {
      console.error('Error getting user role:', error)
      return null
    }
  }

  // Get user's permissions
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      // Try cache first
      const cacheKey = CacheKeys.userPermissions(userId)
      const cachedPermissions = await cacheService.get<Permission[]>(cacheKey)
      if (cachedPermissions) {
        return cachedPermissions
      }

      // Get from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user?.role) {
        return []
      }

      const role = user.role as Role
      const permissions = ROLES[role]?.permissions || []

      // Cache permissions
      await cacheService.set(cacheKey, permissions, CacheTTL.MEDIUM)

      return permissions as Permission[]
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  }

  // Update user role
  static async updateUserRole(
    userId: string,
    newRole: Role,
    updatedBy: string
  ): Promise<boolean> {
    try {
      // Verify updater has permission to change roles
      const canUpdate = await this.hasPermission(updatedBy, PERMISSIONS.SYSTEM_ADMIN)
      if (!canUpdate) {
        return false
      }

      // Update user role
      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as any },
      })

      // Clear cached permissions
      await cacheService.del(CacheKeys.userPermissions(userId))

      // Log role change
      await this.logRoleChange(userId, newRole, updatedBy)

      return true
    } catch (error) {
      console.error('Error updating user role:', error)
      return false
    }
  }

  // Check resource ownership
  static async isResourceOwner(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'order':
          const order = await prisma.order.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          })
          return order?.userId === userId

        case 'review':
          const review = await prisma.review.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          })
          return review?.userId === userId

        case 'user':
          return userId === resourceId

        default:
          return false
      }
    } catch (error) {
      console.error('Error checking resource ownership:', error)
      return false
    }
  }

  // Check if user can access resource
  static async canAccessResource(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Check if user has system admin permission
      const isAdmin = await this.hasPermission(userId, PERMISSIONS.SYSTEM_ADMIN)
      if (isAdmin) {
        return true
      }

      // Check resource-specific permissions
      const permissionMap = {
        order: {
          read: PERMISSIONS.ORDER_READ,
          write: PERMISSIONS.ORDER_WRITE,
          delete: PERMISSIONS.ORDER_DELETE,
        },
        product: {
          read: PERMISSIONS.PRODUCT_READ,
          write: PERMISSIONS.PRODUCT_WRITE,
          delete: PERMISSIONS.PRODUCT_DELETE,
        },
        review: {
          read: PERMISSIONS.REVIEW_READ,
          write: PERMISSIONS.REVIEW_WRITE,
          delete: PERMISSIONS.REVIEW_DELETE,
        },
      }

      const resourcePermissions = permissionMap[resourceType as keyof typeof permissionMap]
      if (!resourcePermissions) {
        return false
      }

      const requiredPermission = resourcePermissions[action]
      const hasPermission = await this.hasPermission(userId, requiredPermission)

      if (hasPermission) {
        return true
      }

      // Check if user owns the resource
      const isOwner = await this.isResourceOwner(userId, resourceType, resourceId)
      if (isOwner && action === 'read') {
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking resource access:', error)
      return false
    }
  }

  // Get all roles
  static getAllRoles(): Array<{ name: Role; permissions: Permission[] }> {
    return Object.entries(ROLES).map(([name, role]) => ({
      name: name as Role,
      permissions: role.permissions as Permission[],
    }))
  }

  // Get all permissions
  static getAllPermissions(): Permission[] {
    return Object.values(PERMISSIONS)
  }

  // Private helper methods
  private static async logRoleChange(
    userId: string,
    newRole: Role,
    updatedBy: string
  ): Promise<void> {
    try {
      // TODO: Implement audit logging with proper database model
      console.log(`Role change logged: User ${userId} role changed to ${newRole} by ${updatedBy}`)
    } catch (error) {
      console.error('Error logging role change:', error)
    }
  }
}

// RBAC middleware for API routes
export function requirePermission(_permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const request = args[0]
      const user = await getServerUser(request)
      
      if (!user?.id) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const hasPermission = await RBACService.hasPermission(user.id, _permission)
      if (!hasPermission) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

// Resource access middleware
export function requireResourceAccess(
  _resourceType: string,
  _action: 'read' | 'write' | 'delete'
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const request = args[0]
      const user = await getServerUser(request)
      
      if (!user?.id) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Extract resource ID from request
      const url = new URL(request.url)
      const resourceId = url.pathname.split('/').pop()

      if (!resourceId) {
        return new Response(
          JSON.stringify({ error: 'Resource ID required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const canAccess = await RBACService.canAccessResource(
        user.id,
        _resourceType,
        resourceId,
        _action
      )

      if (!canAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

export default RBACService
