'use client'

import CheckoutForm from '@/components/CheckoutForm'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CheckoutPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { items, fetchCart } = useCartStore()

  useEffect(() => {
    if (isLoading) return
    
    if (!user) {
      router.push('/auth/signin')
      return
    }

    fetchCart()
  }, [user, isLoading, router, fetchCart])

  const handleOrderSuccess = (order: any) => {
    // Order created successfully, redirect to order confirmation
    router.push(`/orders/${order.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
        <p className="mt-2 text-sm text-gray-700">
          Complete your order
        </p>
      </div>

      <CheckoutForm onSuccess={handleOrderSuccess} />
    </div>
  )
}
