'use client'

import { Star } from 'lucide-react'

interface RatingDisplayProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  showCount?: boolean
  reviewCount?: number
  className?: string
}

export default function RatingDisplay({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = false,
  showCount = false,
  reviewCount,
  className = '',
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={i}
          className={`${sizeClasses[size]} text-yellow-400 fill-current`}
        />
      )
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className={`${sizeClasses[size]} text-gray-300`} />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className={`${sizeClasses[size]} text-yellow-400 fill-current`} />
          </div>
        </div>
      )
    }

    // Empty stars
    const emptyStars = maxRating - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300`}
        />
      )
    }

    return stars
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      
      {showNumber && (
        <span className={`${textSizeClasses[size]} text-gray-600 ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
      
      {showCount && reviewCount !== undefined && (
        <span className={`${textSizeClasses[size]} text-gray-500 ml-1`}>
          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
}
