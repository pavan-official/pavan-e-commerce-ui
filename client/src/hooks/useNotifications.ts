import { useCustomAuth } from '@/hooks/useCustomAuth'
import { useNotificationStore } from '@/stores/notificationStore'
import { useEffect } from 'react'

export function useNotifications() {
  const { user } = useCustomAuth()
  const { 
    addNotification, 
    updateNotification, 
    removeNotification,
    fetchNotifications,
    unreadCount
  } = useNotificationStore()

  // Simple fetch notifications when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
    }
  }, [user?.id, fetchNotifications])

  return {
    addNotification,
    updateNotification,
    removeNotification,
    unreadCount,
    isConnected: !!user?.id
  }
}