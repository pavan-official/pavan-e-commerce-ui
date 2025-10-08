import { useNotificationStore } from '@/stores/notificationStore'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'

export function useNotifications() {
  const { data: session } = useSession()
  const { 
    addNotification, 
    updateNotification, 
    removeNotification,
    setConnectionStatus,
    fetchNotifications,
    unreadCount,
    isConnected 
  } = useNotificationStore()
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!session?.user?.id || eventSourceRef.current) {
      return
    }

    try {
      const eventSource = new EventSource(`/api/notifications/stream?userId=${session.user.id}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('Notification stream connected')
        setConnectionStatus(true)
        reconnectAttempts.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'notification':
              addNotification(data.notification)
              break
            case 'notification_update':
              updateNotification(data.notification.id, data.notification)
              break
            case 'notification_delete':
              removeNotification(data.notificationId)
              break
            case 'ping':
              // Keep connection alive
              break
            default:
              console.log('Unknown notification event type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing notification event:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('Notification stream error:', error)
        setConnectionStatus(false)
        eventSource.close()
        eventSourceRef.current = null
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect notification stream (attempt ${reconnectAttempts.current})`)
            connect()
          }, delay)
        } else {
          console.error('Max reconnection attempts reached for notification stream')
        }
      }
    } catch (error) {
      console.error('Error creating notification stream:', error)
      setConnectionStatus(false)
    }
  }

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setConnectionStatus(false)
    reconnectAttempts.current = 0
  }

  useEffect(() => {
    if (session?.user?.id) {
      // Initial fetch of notifications
      fetchNotifications()
      
      // Connect to real-time stream
      connect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    unreadCount,
    connect,
    disconnect,
  }
}
