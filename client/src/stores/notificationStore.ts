import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Notification {
  id: string
  userId: string
  type: 'ORDER_UPDATE' | 'PAYMENT_UPDATE' | 'REVIEW_MODERATION' | 'REVIEW_DELETED' | 'SYSTEM_ANNOUNCEMENT' | 'PROMOTION'
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface NotificationFilters {
  page: number
  limit: number
  type?: string
  unreadOnly: boolean
  sortBy: 'createdAt' | 'isRead' | 'type'
  sortOrder: 'asc' | 'desc'
}

interface NotificationState {
  // Data
  notifications: Notification[]
  pagination: NotificationPagination | null
  unreadCount: number
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Filters
  filters: NotificationFilters
  
  // Real-time state
  isConnected: boolean
  lastNotificationId: string | null
}

interface NotificationActions {
  // Data operations
  fetchNotifications: (filters?: Partial<NotificationFilters>) => Promise<void>
  fetchNotification: (id: string) => Promise<Notification | null>
  markAsRead: (id: string) => Promise<void>
  markAsUnread: (id: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  
  // Bulk operations
  markAllAsRead: () => Promise<void>
  markAllAsUnread: () => Promise<void>
  deleteAllNotifications: () => Promise<void>
  deleteReadNotifications: () => Promise<void>
  
  // Filter operations
  setFilters: (filters: Partial<NotificationFilters>) => void
  setPage: (page: number) => void
  setTypeFilter: (type?: string) => void
  setUnreadOnly: (unreadOnly: boolean) => void
  setSorting: (sortBy: NotificationFilters['sortBy'], sortOrder: NotificationFilters['sortOrder']) => void
  
  // Real-time operations
  addNotification: (notification: Notification) => void
  updateNotification: (id: string, updates: Partial<Notification>) => void
  removeNotification: (id: string) => void
  setConnectionStatus: (isConnected: boolean) => void
  
  // Local state management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

const initialFilters: NotificationFilters = {
  page: 1,
  limit: 20,
  unreadOnly: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      pagination: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      filters: { ...initialFilters },
      isConnected: false,
      lastNotificationId: null,

      // Actions
      fetchNotifications: async (newFilters?: Partial<NotificationFilters>) => {
        const { filters } = get()
        const searchFilters = { ...filters, ...newFilters }
        
        set({ isLoading: true, error: null })
        
        try {
          const params = new URLSearchParams()
          Object.entries(searchFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              params.append(key, String(value))
            }
          })
          
          const response = await fetch(`/api/notifications/?${params.toString()}`)
          const data = await response.json()
          
          if (data.success) {
            set({
              notifications: data.data.notifications,
              pagination: data.data.pagination,
              unreadCount: data.data.unreadCount,
              filters: searchFilters,
              isLoading: false,
            })
          } else {
            set({
              error: data.error?.message || 'Failed to fetch notifications',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while fetching notifications',
            isLoading: false,
          })
        }
      },

      fetchNotification: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`)
          const data = await response.json()
          
          if (data.success) {
            return data.data
          } else {
            set({ error: data.error?.message || 'Failed to fetch notification' })
            return null
          }
        } catch (_error) {
          set({ error: 'An error occurred while fetching notification' })
          return null
        }
      },

      markAsRead: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isRead: true }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Update local state
            set(state => ({
              notifications: state.notifications.map(notification =>
                notification.id === id
                  ? { ...notification, isRead: true }
                  : notification
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            }))
          } else {
            set({ error: data.error?.message || 'Failed to mark notification as read' })
          }
        } catch (_error) {
          set({ error: 'An error occurred while marking notification as read' })
        }
      },

      markAsUnread: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isRead: false }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Update local state
            set(state => ({
              notifications: state.notifications.map(notification =>
                notification.id === id
                  ? { ...notification, isRead: false }
                  : notification
              ),
              unreadCount: state.unreadCount + 1,
            }))
          } else {
            set({ error: data.error?.message || 'Failed to mark notification as unread' })
          }
        } catch (_error) {
          set({ error: 'An error occurred while marking notification as unread' })
        }
      },

      deleteNotification: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Remove from local state
            set(state => {
              const notification = state.notifications.find(n => n.id === id)
              return {
                notifications: state.notifications.filter(n => n.id !== id),
                unreadCount: notification && !notification.isRead 
                  ? Math.max(0, state.unreadCount - 1)
                  : state.unreadCount,
              }
            })
          } else {
            set({ error: data.error?.message || 'Failed to delete notification' })
          }
        } catch (_error) {
          set({ error: 'An error occurred while deleting notification' })
        }
      },

      // Bulk operations
      markAllAsRead: async () => {
        try {
          const response = await fetch('/api/notifications/bulk/', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'markAllRead' }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Update local state
            set(state => ({
              notifications: state.notifications.map(notification => ({
                ...notification,
                isRead: true,
              })),
              unreadCount: 0,
            }))
          } else {
            set({ error: data.error?.message || 'Failed to mark all notifications as read' })
          }
        } catch (_error) {
          set({ error: 'An error occurred while marking all notifications as read' })
        }
      },

      markAllAsUnread: async () => {
        try {
          const response = await fetch('/api/notifications/bulk/', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'markAllUnread' }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Update local state
            set(state => ({
              notifications: state.notifications.map(notification => ({
                ...notification,
                isRead: false,
              })),
              unreadCount: state.notifications.length,
            }))
          } else {
            set({ error: data.error?.message || 'Failed to mark all notifications as unread' })
          }
        } catch (_error) {
          set({ error: 'An error occurred while marking all notifications as unread' })
        }
      },

      deleteAllNotifications: async () => {
        try {
          const response = await fetch('/api/notifications/bulk/', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'deleteAll' }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Clear local state
            set({
              notifications: [],
              unreadCount: 0,
            })
          } else {
            set({ error: data.error?.message || 'Failed to delete all notifications' })
          }
        } catch (_error) {
          set({ error: 'An error occurred while deleting all notifications' })
        }
      },

      deleteReadNotifications: async () => {
        try {
          const response = await fetch('/api/notifications/bulk/', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'deleteRead' }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Remove read notifications from local state
            set(state => ({
              notifications: state.notifications.filter(notification => !notification.isRead),
            }))
          } else {
            set({ error: data.error?.message || 'Failed to delete read notifications' })
          }
        } catch (_error) {
          set({ error: 'An error occurred while deleting read notifications' })
        }
      },

      // Filter operations
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
        }))
      },

      setPage: (page) => {
        set(state => ({
          filters: { ...state.filters, page },
        }))
      },

      setTypeFilter: (type) => {
        set(state => ({
          filters: { ...state.filters, type },
        }))
      },

      setUnreadOnly: (unreadOnly) => {
        set(state => ({
          filters: { ...state.filters, unreadOnly },
        }))
      },

      setSorting: (sortBy, sortOrder) => {
        set(state => ({
          filters: { ...state.filters, sortBy, sortOrder },
        }))
      },

      // Real-time operations
      addNotification: (notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
          lastNotificationId: notification.id,
        }))
      },

      updateNotification: (id, updates) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id
              ? { ...notification, ...updates }
              : notification
          ),
        }))
      },

      removeNotification: (id) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notification && !notification.isRead 
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }
        })
      },

      setConnectionStatus: (isConnected) => {
        set({ isConnected })
      },

      // Local state setters
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        filters: state.filters,
        lastNotificationId: state.lastNotificationId,
      }),
    }
  )
)
