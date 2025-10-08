import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Server-Sent Events stream for real-time notifications
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId || userId !== session.user.id) {
    return new Response('Forbidden', { status: 403 })
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

      // Set up periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`))
        } catch (error) {
          console.error('Error sending ping:', error)
          clearInterval(pingInterval)
        }
      }, 30000) // Ping every 30 seconds

      // Store the controller for potential future use
      // In a real implementation, you'd want to store this in a Map or similar
      // to be able to send notifications to specific users
      if (!global.notificationStreams) {
        global.notificationStreams = new Map()
      }
      global.notificationStreams.set(userId, {
        controller,
        pingInterval,
        lastActivity: Date.now(),
      })

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval)
        if (global.notificationStreams) {
          global.notificationStreams.delete(userId)
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// Helper function to send notification to a specific user
export async function sendNotificationToUser(userId: string, notification: any) {
  if (!global.notificationStreams) {
    return false
  }

  const userStream = global.notificationStreams.get(userId)
  if (!userStream) {
    return false
  }

  try {
    const encoder = new TextEncoder()
    userStream.controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: 'notification', notification })}\n\n`)
    )
    userStream.lastActivity = Date.now()
    return true
  } catch (error) {
    console.error('Error sending notification to user:', error)
    // Clean up the stream if it's no longer valid
    if (global.notificationStreams) {
      global.notificationStreams.delete(userId)
    }
    return false
  }
}

// Helper function to update notification for a specific user
export async function updateNotificationForUser(userId: string, notification: any) {
  if (!global.notificationStreams) {
    return false
  }

  const userStream = global.notificationStreams.get(userId)
  if (!userStream) {
    return false
  }

  try {
    const encoder = new TextEncoder()
    userStream.controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: 'notification_update', notification })}\n\n`)
    )
    userStream.lastActivity = Date.now()
    return true
  } catch (error) {
    console.error('Error updating notification for user:', error)
    // Clean up the stream if it's no longer valid
    if (global.notificationStreams) {
      global.notificationStreams.delete(userId)
    }
    return false
  }
}

// Helper function to delete notification for a specific user
export async function deleteNotificationForUser(userId: string, notificationId: string) {
  if (!global.notificationStreams) {
    return false
  }

  const userStream = global.notificationStreams.get(userId)
  if (!userStream) {
    return false
  }

  try {
    const encoder = new TextEncoder()
    userStream.controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: 'notification_delete', notificationId })}\n\n`)
    )
    userStream.lastActivity = Date.now()
    return true
  } catch (error) {
    console.error('Error deleting notification for user:', error)
    // Clean up the stream if it's no longer valid
    if (global.notificationStreams) {
      global.notificationStreams.delete(userId)
    }
    return false
  }
}

// Clean up inactive streams periodically
setInterval(() => {
  if (!global.notificationStreams) {
    return
  }

  const now = Date.now()
  const inactiveThreshold = 5 * 60 * 1000 // 5 minutes

  for (const [userId, stream] of global.notificationStreams.entries()) {
    if (now - stream.lastActivity > inactiveThreshold) {
      console.log(`Cleaning up inactive notification stream for user ${userId}`)
      clearInterval(stream.pingInterval)
      global.notificationStreams.delete(userId)
    }
  }
}, 60000) // Check every minute

// Extend global type for TypeScript
declare global {
  var notificationStreams: Map<string, {
    controller: ReadableStreamDefaultController
    pingInterval: NodeJS.Timeout
    lastActivity: number
  }> | undefined
}
