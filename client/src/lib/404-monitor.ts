// 404 Error Monitoring and Analytics
export interface Error404Event {
  url: string
  referrer?: string
  userAgent?: string
  timestamp: Date
  userId?: string
  sessionId?: string
}

class Error404Monitor {
  private events: Error404Event[] = []
  private maxEvents = 1000 // Keep last 1000 events

  log404(url: string, referrer?: string, userAgent?: string, userId?: string, sessionId?: string) {
    const event: Error404Event = {
      url,
      referrer,
      userAgent,
      timestamp: new Date(),
      userId,
      sessionId,
    }

    this.events.push(event)
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('404 Error:', {
        url,
        referrer,
        timestamp: event.timestamp.toISOString(),
      })
    }

    // In production, you might want to send this to an analytics service
    // this.sendToAnalytics(event)
  }

  getRecent404s(minutes: number = 60): Error404Event[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.events.filter(event => event.timestamp > cutoff)
  }

  getTop404Urls(limit: number = 10): { url: string; count: number }[] {
    const urlCounts = new Map<string, number>()
    
    this.events.forEach(event => {
      const count = urlCounts.get(event.url) || 0
      urlCounts.set(event.url, count + 1)
    })

    return Array.from(urlCounts.entries())
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  get404Stats() {
    const total = this.events.length
    const last24h = this.getRecent404s(24 * 60).length
    const lastHour = this.getRecent404s(60).length
    const topUrls = this.getTop404Urls(5)

    return {
      total,
      last24h,
      lastHour,
      topUrls,
    }
  }

  // Method to send to analytics service (implement as needed)
  private sendToAnalytics(event: Error404Event) {
    // Example: Send to your analytics service
    // fetch('/api/analytics/404', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // })
  }
}

// Singleton instance
export const error404Monitor = new Error404Monitor()

// Client-side 404 tracking
export function track404(url: string, referrer?: string) {
  if (typeof window !== 'undefined') {
    error404Monitor.log404(
      url,
      referrer,
      navigator.userAgent,
      // You might want to get these from your auth system
      undefined, // userId
      undefined  // sessionId
    )
  }
}

