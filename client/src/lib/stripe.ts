import Stripe from 'stripe'

// Lazy initialization of Stripe instance
let stripeInstance: Stripe | null = null

// Server-side Stripe instance with lazy initialization
export const getStripeInstance = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    
    // During build time, return a mock instance
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('⚠️ Using mock Stripe instance during build phase')
      stripeInstance = new Stripe('sk_test_mock_key_for_build', {
        apiVersion: '2025-09-30.clover',
        typescript: true,
      })
    } else if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    } else {
      stripeInstance = new Stripe(secretKey, {
        apiVersion: '2025-09-30.clover',
        typescript: true,
      })
    }
  }
  
  return stripeInstance
}

// Backward compatibility export
export const stripe = getStripeInstance()

// Client-side Stripe instance
export const getStripe = () => {
  if (typeof window !== 'undefined') {
    const { loadStripe } = require('@stripe/stripe-js')
    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return null
}

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethods: ['card'],
  mode: 'payment',
} as const

// Payment method types
export const PAYMENT_METHOD_TYPES = {
  CREDIT_CARD: 'card',
  DEBIT_CARD: 'card',
  PAYPAL: 'paypal',
} as const

// Order status mapping
export const ORDER_STATUS_MAPPING = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

// Payment status mapping
export const PAYMENT_STATUS_MAPPING = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'canceled',
  REFUNDED: 'refunded',
} as const
