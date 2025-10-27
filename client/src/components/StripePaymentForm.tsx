'use client'

import { useCustomAuth } from '@/hooks/useCustomAuth'
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCallback, useEffect, useState } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentFormProps {
  orderId: string
  amount: number
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}

function PaymentForm({ orderId, amount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useCustomAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((error: string) => {
    onError(error)
  }, [onError])

  useEffect(() => {
    if (!user) return

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        })

        const data = await response.json()

        if (data.success) {
          setClientSecret(data.data.clientSecret)
        } else {
          handleError(data.error?.message || 'Failed to create payment intent')
        }
      } catch (error) {
        console.error('Error creating payment intent:', error)
        handleError('An error occurred while creating payment intent')
      }
    }

    createPaymentIntent()
  }, [orderId, user, handleError])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Card element not found')
      setIsProcessing(false)
      return
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.name || undefined,
            email: user?.email || undefined,
          },
        },
      })

      if (error) {
        setError(error.message || 'Payment failed')
        onError(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('An unexpected error occurred')
      onError('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  if (!clientSecret) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Preparing payment...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-3">
              <CardElement options={cardElementOptions} />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Total Amount</span>
              <span className="text-lg font-semibold text-gray-900">
                ${amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
