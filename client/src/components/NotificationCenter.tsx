'use client'

import { useNotificationStore } from '@/stores/notificationStore'
import {
    AlertCircle,
    Bell,
    Check,
    CheckCheck,
    CreditCard,
    Filter,
    Gift,
    Megaphone,
    MessageSquare,
    Package,
    Trash2
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface NotificationCenterProps {
  _onClose?: () => void
  className?: string
}

const notificationIcons = {
  ORDER_UPDATE: Package,
  PAYMENT_UPDATE: CreditCard,
  REVIEW_MODERATION: MessageSquare,
  REVIEW_DELETED: MessageSquare,
  SYSTEM_ANNOUNCEMENT: Megaphone,
  PROMOTION: Gift,
}

const notificationColors = {
  ORDER_UPDATE: 'text-blue-600 bg-blue-100',
  PAYMENT_UPDATE: 'text-green-600 bg-green-100',
  REVIEW_MODERATION: 'text-yellow-600 bg-yellow-100',
  REVIEW_DELETED: 'text-red-600 bg-red-100',
  SYSTEM_ANNOUNCEMENT: 'text-purple-600 bg-purple-100',
  PROMOTION: 'text-pink-600 bg-pink-100',
}

export default function NotificationCenter({ _onClose, className = '' }: NotificationCenterProps) {
  const {
    notifications,
    pagination,
    unreadCount,
    isLoading,
    error,
    filters,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    deleteAllNotifications,
    deleteReadNotifications,
    setFilters,
    setPage,
    setTypeFilter,
    setUnreadOnly,
  } = useNotificationStore()

  const [showFilters, setShowFilters] = useState(false)
  const [_selectedNotifications, _setSelectedNotifications] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleMarkAsUnread = async (id: string) => {
    await markAsUnread(id)
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const _handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete all notifications?')) {
      await deleteAllNotifications()
    }
  }

  const handleDeleteRead = async () => {
    if (confirm('Are you sure you want to delete all read notifications?')) {
      await deleteReadNotifications()
    }
  }

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type === 'all' ? undefined : type)
    setPage(1)
  }

  const handleUnreadFilter = (unreadOnly: boolean) => {
    setUnreadOnly(unreadOnly)
    setPage(1)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    const IconComponent = notificationIcons[type as keyof typeof notificationIcons] || AlertCircle
    return IconComponent
  }

  const getNotificationColor = (type: string) => {
    return notificationColors[type as keyof typeof notificationColors] || 'text-gray-600 bg-gray-100'
  }

  if (isLoading && notifications.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchNotifications()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Filters and Actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500">
              {unreadCount} unread
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteRead}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete read notifications"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="space-y-3">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'ORDER_UPDATE', 'PAYMENT_UPDATE', 'REVIEW_MODERATION', 'SYSTEM_ANNOUNCEMENT', 'PROMOTION'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeFilter(type)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      (filters.type === type) || (type === 'all' && !filters.type)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Unread Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUnreadFilter(false)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    !filters.unreadOnly
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleUnreadFilter(true)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filters.unreadOnly
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unread Only
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type)
              const colorClass = getNotificationColor(notification.type)
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead ? (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsUnread(notification.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Mark as unread"
                            >
                              <CheckCheck className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
