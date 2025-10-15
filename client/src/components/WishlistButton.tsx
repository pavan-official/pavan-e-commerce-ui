'use client'

import { useWishlistStore } from '@/stores/wishlistStore'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface WishlistButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function WishlistButton({
  productId,
  className = '',
  size = 'md',
}: WishlistButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addToWishlist, removeFromWishlist, isInWishlist, isLoading } = useWishlistStore()
  const [isToggling, setIsToggling] = useState(false)

  const inWishlist = isInWishlist(productId)

  const handleToggleWishlist = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    setIsToggling(true)
    try {
      if (inWishlist) {
        // Find the wishlist item ID
        const wishlistItems = useWishlistStore.getState().items
        const item = wishlistItems.find(item => item.productId === productId)
        if (item) {
          await removeFromWishlist(item.id)
        }
      } else {
        await addToWishlist(productId)
      }
    } finally {
      setIsToggling(false)
    }
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const isDisabled = isLoading || isToggling

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isDisabled}
      className={`${sizeClasses[size]} rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className} ${
        inWishlist ? 'text-red-500 border-red-300 bg-red-50' : 'text-gray-400 hover:text-red-500'
      }`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isToggling ? (
        <svg className={`${iconSizes[size]} animate-spin`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          className={iconSizes[size]}
          fill={inWishlist ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  )
}
