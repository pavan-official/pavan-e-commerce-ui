'use client'

import { useCustomAuth } from '@/hooks/useCustomAuth'
import { useEffect, useState } from 'react'

interface PaymentStatusProps {
  paymentId: string
  onStatusChange?: (status: string) => void
}

interface Payment {
  id: string
  status: string
  amount: number
  currency: string
  method: string
  provider: string
  providerId: string
  createdAt: string
  processedAt?: string
  order: {
    id: string
    orderNumber: string
    status: string
    paymentStatus: string
    total: number
  }
}

export default function PaymentStatus({ paymentId, onStatusChange }: PaymentStatusProps) {
  const { user } = useCustomAuth()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !paymentId) return

    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}`)
        const data = await response.json()

        if (data.success) {
          setPayment(data.data)
          onStatusChange?.(data.data.status)
        } else {
          setError(data.error?.message || 'Failed to fetch payment status')
        }
      } catch (error) {
        console.error('Error fetching payment status:', error)
        setError('An error occurred while fetching payment status')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentStatus()

    // Poll for status updates every 30 seconds if payment is still pending
    const interval = setInterval(() => {
      if (payment?.status === 'PENDING' || payment?.status === 'PROCESSING') {
        fetchPaymentStatus()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [paymentId, user, onStatusChange, payment?.status])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'PROCESSING':
        return (
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'COMPLETED':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'FAILED':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'CANCELLED':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'REFUNDED':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading payment status...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">{error}</div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="text-gray-700">Payment not found</div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Payment Status</h3>
      </div>
      
      <div className="px-6 py-4 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(payment.status)}
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
              {payment.status}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Amount</span>
          <span className="text-sm font-semibold text-gray-900">
            ${payment.amount.toFixed(2)} {payment.currency}
          </span>
        </div>

        {/* Payment Method */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Payment Method</span>
          <span className="text-sm text-gray-900 capitalize">
            {payment.method.replace('_', ' ')}
          </span>
        </div>

        {/* Provider */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Provider</span>
          <span className="text-sm text-gray-900 capitalize">
            {payment.provider}
          </span>
        </div>

        {/* Created At */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Created</span>
          <span className="text-sm text-gray-900">
            {new Date(payment.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Processed At */}
        {payment.processedAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Processed</span>
            <span className="text-sm text-gray-900">
              {new Date(payment.processedAt).toLocaleString()}
            </span>
          </div>
        )}

        {/* Order Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Order Status</span>
          <span className="text-sm text-gray-900">
            {payment.order.status} / {payment.order.paymentStatus}
          </span>
        </div>

        {/* Payment ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Payment ID</span>
          <span className="text-sm text-gray-900 font-mono">
            {payment.providerId}
          </span>
        </div>
      </div>
    </div>
  )
}
