import { DELETE as notificationDELETE, GET as notificationGET, PUT as notificationPUT } from '@/app/api/notifications/[id]/route'
import { PUT as bulkPUT } from '@/app/api/notifications/bulk/route'
import { GET as notificationsGET, POST as notificationsPOST } from '@/app/api/notifications/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.Mock

describe('GET /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should return user notifications with pagination', async () => {
    const mockNotifications = [
      {
        id: '1',
        userId: 'user123',
        type: 'ORDER_UPDATE',
        title: 'Order Created',
        message: 'Your order has been created',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.notification.findMany.mockResolvedValue(mockNotifications)
    mockPrisma.notification.count.mockResolvedValueOnce(1) // total
    mockPrisma.notification.count.mockResolvedValueOnce(1) // unread

    const request = new NextRequest('http://localhost/api/notifications?page=1&limit=20')
    const response = await notificationsGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.notifications).toHaveLength(1)
    expect(data.data.pagination.page).toBe(1)
    expect(data.data.unreadCount).toBe(1)
  })

  it('should filter notifications by type', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])
    mockPrisma.notification.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost/api/notifications?type=ORDER_UPDATE')
    const response = await notificationsGET(request)

    expect(response.status).toBe(200)
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user123',
          type: 'ORDER_UPDATE',
        }),
      })
    )
  })

  it('should filter unread notifications only', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])
    mockPrisma.notification.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost/api/notifications?unreadOnly=true')
    const response = await notificationsGET(request)

    expect(response.status).toBe(200)
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user123',
          isRead: false,
        }),
      })
    )
  })

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/notifications')
    const response = await notificationsGET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })
})

describe('POST /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should create a new notification', async () => {
    const mockNotification = {
      id: '1',
      userId: 'user123',
      type: 'ORDER_UPDATE',
      title: 'Order Created',
      message: 'Your order has been created',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrisma.notification.create.mockResolvedValue(mockNotification)

    const request = new NextRequest('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        type: 'ORDER_UPDATE',
        title: 'Order Created',
        message: 'Your order has been created',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await notificationsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.title).toBe('Order Created')
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user123',
        type: 'ORDER_UPDATE',
        title: 'Order Created',
        message: 'Your order has been created',
        data: {},
        isRead: false,
      },
    })
  })

  it('should return 400 for invalid data', async () => {
    const request = new NextRequest('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        type: 'INVALID_TYPE',
        title: '',
        message: 'Short',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await notificationsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        type: 'ORDER_UPDATE',
        title: 'Test',
        message: 'Test message',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await notificationsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })
})

describe('GET /api/notifications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should return a specific notification', async () => {
    const mockNotification = {
      id: '1',
      userId: 'user123',
      type: 'ORDER_UPDATE',
      title: 'Order Created',
      message: 'Your order has been created',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrisma.notification.findFirst.mockResolvedValue(mockNotification)

    const request = new NextRequest('http://localhost/api/notifications/1')
    const response = await notificationGET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('1')
  })

  it('should return 404 if notification not found', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/notifications/1')
    const response = await notificationGET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('NOTIFICATION_NOT_FOUND')
  })
})

describe('PUT /api/notifications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should update a notification', async () => {
    const mockNotification = {
      id: '1',
      userId: 'user123',
      type: 'ORDER_UPDATE',
      title: 'Order Created',
      message: 'Your order has been created',
      isRead: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrisma.notification.findFirst.mockResolvedValue(mockNotification)
    mockPrisma.notification.update.mockResolvedValue(mockNotification)

    const request = new NextRequest('http://localhost/api/notifications/1', {
      method: 'PUT',
      body: JSON.stringify({ isRead: true }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await notificationPUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.isRead).toBe(true)
  })

  it('should return 404 if notification not found', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/notifications/1', {
      method: 'PUT',
      body: JSON.stringify({ isRead: true }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await notificationPUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('NOTIFICATION_NOT_FOUND')
  })
})

describe('DELETE /api/notifications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should delete a notification', async () => {
    const mockNotification = {
      id: '1',
      userId: 'user123',
    }

    mockPrisma.notification.findFirst.mockResolvedValue(mockNotification)
    mockPrisma.notification.delete.mockResolvedValue(mockNotification)

    const request = new NextRequest('http://localhost/api/notifications/1', {
      method: 'DELETE',
    })

    const response = await notificationDELETE(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Notification deleted successfully')
  })

  it('should return 404 if notification not found', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/notifications/1', {
      method: 'DELETE',
    })

    const response = await notificationDELETE(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('NOTIFICATION_NOT_FOUND')
  })
})

describe('PUT /api/notifications/bulk', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123', email: 'test@example.com' } })
  })

  it('should mark all notifications as read', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 })

    const request = new NextRequest('http://localhost/api/notifications/bulk', {
      method: 'PUT',
      body: JSON.stringify({ action: 'markAllRead' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await bulkPUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.action).toBe('markAllRead')
    expect(data.data.affectedCount).toBe(5)
  })

  it('should delete all notifications', async () => {
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 10 })

    const request = new NextRequest('http://localhost/api/notifications/bulk', {
      method: 'PUT',
      body: JSON.stringify({ action: 'deleteAll' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await bulkPUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.action).toBe('deleteAll')
    expect(data.data.affectedCount).toBe(10)
  })

  it('should delete read notifications only', async () => {
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 3 })

    const request = new NextRequest('http://localhost/api/notifications/bulk', {
      method: 'PUT',
      body: JSON.stringify({ action: 'deleteRead' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await bulkPUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.action).toBe('deleteRead')
    expect(data.data.affectedCount).toBe(3)
  })

  it('should return 400 for invalid action', async () => {
    const request = new NextRequest('http://localhost/api/notifications/bulk', {
      method: 'PUT',
      body: JSON.stringify({ action: 'invalidAction' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await bulkPUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/notifications/bulk', {
      method: 'PUT',
      body: JSON.stringify({ action: 'markAllRead' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await bulkPUT(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })
})
