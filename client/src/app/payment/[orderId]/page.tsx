'use client'

import PaymentStatus from '@/components/PaymentStatus'
import StripePaymentForm from '@/components/StripePaymentForm'
import { useOrderStore } from '@/stores/orderStore'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'

interface PaymentPageProps {
  params: Promise<{ orderId: string }>
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.orderId
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: 'loading' }
  const router = useRouter()
  const { currentOrder, fetchOrder, isLoading, error } = useOrderStore()
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchOrder(orderId)
  }, [session, status, router, fetchOrder, orderId])

  const handlePaymentSuccess = (stripePaymentId: string) => {
    setPaymentId(stripePaymentId)
    setPaymentStatus('COMPLETED')
    
    // Redirect to order confirmation after a short delay
    setTimeout(() => {
      router.push(`/orders/${orderId}`)
    }, 2000)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    // Error is handled by the payment form component
  }

  const handleStatusChange = (status: string) => {
    setPaymentStatus(status)
    
    if (status === 'COMPLETED') {
      // Redirect to order confirmation
      setTimeout(() => {
        router.push(`/orders/${orderId}`)
      }, 2000)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
        </div>
      </div>
    )
  }

  if (!currentOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <h1 className="text-2xl font-semibold text-gray-900">Order Not Found</h1>
          <p className="mt-2 text-gray-600">The order you're looking for doesn't exist.</p>
          <Link
            href="/orders"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            View All Orders
          </Link>
        </div>
      </div>
    )
  }

  if (currentOrder.paymentStatus === 'COMPLETED') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Payment Already Completed</h1>
          <p className="mt-2 text-gray-600">
            This order has already been paid for.
          </p>
          <Link
            href={`/orders/${currentOrder.id}`}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            View Order Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Complete Payment</h1>
        <p className="mt-2 text-sm text-gray-700">
          Order #{currentOrder.orderNumber}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div>
          {paymentStatus === 'COMPLETED' ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Successful!</h2>
              <p className="mt-2 text-gray-600">
                Your payment has been processed successfully. Redirecting to order details...
              </p>
            </div>
          ) : (
            <StripePaymentForm
              orderId={currentOrder.id}
              amount={currentOrder.total}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Order Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${currentOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${currentOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">${currentOrder.shipping.toFixed(2)}</span>
              </div>
              {currentOrder.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">-${currentOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${currentOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {paymentId && (
            <PaymentStatus
              paymentId={paymentId}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Secure Payment</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Your payment information is encrypted and secure. We use Stripe for payment processing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
