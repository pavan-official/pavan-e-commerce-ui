import { ReactNode, useEffect, useRef, useState } from 'react'

interface LazyLoadProps {
  children: ReactNode
  threshold?: number
  rootMargin?: string
  fallback?: ReactNode
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
}

const LazyLoad = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  fallback,
  className,
  style,
  onLoad,
}: LazyLoadProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
          onLoad?.()
          observer.unobserve(element)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, hasLoaded, onLoad])

  return (
    <div ref={elementRef} className={className} style={style}>
      {isVisible ? children : fallback}
    </div>
  )
}

export default LazyLoad
