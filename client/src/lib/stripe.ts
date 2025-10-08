import Stripe from 'stripe'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

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
