import { GenericObject, GenericGenericFunction, ErrorResponse } from '@/types/common';
// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()
  private observers: PerformanceObserver[] = []

  private constructor() {
    this.initializeObservers()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return

    // Monitor Core Web Vitals
    this.observeWebVitals()
    
    // Monitor resource loading
    this.observeResourceTiming()
    
    // Monitor navigation timing
    this.observeNavigationTiming()
  }

  private observeWebVitals() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.metrics.set('lcp', lastEntry.startTime)
      this.reportMetric('lcp', lastEntry.startTime)
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    this.observers.push(lcpObserver)

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.metrics.set('fid', entry.processingStart - entry.startTime)
        this.reportMetric('fid', entry.processingStart - entry.startTime)
      })
    })
    fidObserver.observe({ entryTypes: ['first-input'] })
    this.observers.push(fidObserver)

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.metrics.set('cls', clsValue)
      this.reportMetric('cls', clsValue)
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
    this.observers.push(clsObserver)
  }

  private observeResourceTiming() {
    if (typeof window === 'undefined') return

    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          this.trackResourceTiming(resourceEntry)
        }
      })
    })
    resourceObserver.observe({ entryTypes: ['resource'] })
    this.observers.push(resourceObserver)
  }

  private observeNavigationTiming() {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.trackNavigationTiming(navigation)
      }
    })
  }

  private trackResourceTiming(entry: PerformanceResourceTiming) {
    const resourceType = this.getResourceType(entry.name)
    const duration = entry.responseEnd - entry.requestStart

    // Track slow resources
    if (duration > 1000) {
      this.reportMetric('slow-resource', duration, {
        type: resourceType,
        url: entry.name,
        size: entry.transferSize,
      })
    }

    // Track resource timing by type
    this.metrics.set(`${resourceType}-duration`, duration)
    this.metrics.set(`${resourceType}-size`, entry.transferSize)
  }

  private trackNavigationTiming(navigation: PerformanceNavigationTiming) {
    const metrics = {
      'dom-content-loaded': navigation.domContentLoadedEventEnd - navigation.startTime,
      'load-complete': navigation.loadEventEnd - navigation.startTime,
      'first-byte': navigation.responseStart - navigation.startTime,
      'dns-lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
      'tcp-connect': navigation.connectEnd - navigation.connectStart,
      'ssl-negotiate': navigation.secureConnectionStart > 0 
        ? navigation.connectEnd - navigation.secureConnectionStart 
        : 0,
    }

    Object.entries(metrics).forEach(([key, value]) => {
      this.metrics.set(key, value)
      this.reportMetric(key, value)
    })
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image'
    if (url.includes('api/')) return 'api'
    return 'other'
  }

  private reportMetric(name: string, value: number, metadata?: any) {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        ...metadata,
      })
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric: ${name} = ${value}ms`, metadata)
    }
  }

  // Manual performance tracking
  public startTiming(name: string): () => void {
    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      this.metrics.set(name, duration)
      this.reportMetric(name, duration)
    }
  }

  // Get all metrics
  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  // Get specific metric
  public getMetric(name: string): number | undefined {
    return this.metrics.get(name)
  }

  // Clear metrics
  public clearMetrics(): void {
    this.metrics.clear()
  }

  // Cleanup observers
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()

  const startTiming = (name: string) => {
    return monitor.startTiming(name)
  }

  const getMetrics = () => {
    return monitor.getMetrics()
  }

  const getMetric = (name: string) => {
    return monitor.getMetric(name)
  }

  return {
    startTiming,
    getMetrics,
    getMetric,
  }
}

// Performance decorator for functions
export function measurePerformance(_name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance()
      const endTiming = monitor.startTiming(`${name}.${propertyKey}`)
      
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } finally {
        endTiming()
      }
    }

    return descriptor
  }
}

// Web Vitals thresholds
export const WEB_VITALS_THRESHOLDS = {
  lcp: {
    good: 2500,
    needsImprovement: 4000,
  },
  fid: {
    good: 100,
    needsImprovement: 300,
  },
  cls: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  fcp: {
    good: 1800,
    needsImprovement: 3000,
  },
  ttfb: {
    good: 800,
    needsImprovement: 1800,
  },
}

// Performance score calculator
export function calculatePerformanceScore(metrics: Record<string, number>): number {
  const scores = []

  // LCP Score
  if (metrics.lcp) {
    if (metrics.lcp <= WEB_VITALS_THRESHOLDS.lcp.good) {
      scores.push(100)
    } else if (metrics.lcp <= WEB_VITALS_THRESHOLDS.lcp.needsImprovement) {
      scores.push(75)
    } else {
      scores.push(25)
    }
  }

  // FID Score
  if (metrics.fid) {
    if (metrics.fid <= WEB_VITALS_THRESHOLDS.fid.good) {
      scores.push(100)
    } else if (metrics.fid <= WEB_VITALS_THRESHOLDS.fid.needsImprovement) {
      scores.push(75)
    } else {
      scores.push(25)
    }
  }

  // CLS Score
  if (metrics.cls) {
    if (metrics.cls <= WEB_VITALS_THRESHOLDS.cls.good) {
      scores.push(100)
    } else if (metrics.cls <= WEB_VITALS_THRESHOLDS.cls.needsImprovement) {
      scores.push(75)
    } else {
      scores.push(25)
    }
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
}

export default PerformanceMonitor
