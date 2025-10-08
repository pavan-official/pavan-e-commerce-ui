'use client'

import { useCartStore } from '@/stores/cartStore'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AddToCartButtonProps {
  productId: string
  variantId?: string
  className?: string
  children?: React.ReactNode
  disabled?: boolean
}

export default function AddToCartButton({
  productId,
  variantId,
  className = '',
  children,
  disabled = false,
}: AddToCartButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addToCart, isLoading } = useCartStore()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    setIsAdding(true)
    try {
      await addToCart(productId, variantId, 1)
    } finally {
      setIsAdding(false)
    }
  }

  const isDisabled = disabled || isLoading || isAdding

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isAdding ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Adding...
        </>
      ) : (
        children || 'Add to Cart'
      )}
    </button>
  )
}
