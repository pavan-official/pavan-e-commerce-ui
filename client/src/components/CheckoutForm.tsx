'use client'

import { useCustomAuth } from '@/hooks/useCustomAuth'
import { useCartStore } from '@/stores/cartStore'
import { useOrderStore } from '@/stores/orderStore'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CheckoutFormProps {
  onSuccess?: (order: any) => void
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { user } = useCustomAuth()
  const router = useRouter()
  const { summary, items } = useCartStore()
  const { createOrder, isLoading } = useOrderStore()

  const [formData, setFormData] = useState({
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    paymentMethod: 'credit_card',
    shippingMethod: 'standard',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [useSameAddress, setUseSameAddress] = useState(true)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const [section, field] = name.split('.')

    setFormData(prev => {
      const currentSection = prev[section as keyof typeof prev] || {}
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [field]: value,
        },
      }
    })

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    
    // Validate shipping address
    if (!formData.shippingAddress.street.trim()) newErrors['shippingAddress.street'] = 'Street address is required'
    if (!formData.shippingAddress.city.trim()) newErrors['shippingAddress.city'] = 'City is required'
    if (!formData.shippingAddress.state.trim()) newErrors['shippingAddress.state'] = 'State is required'
    if (!formData.shippingAddress.zipCode.trim()) newErrors['shippingAddress.zipCode'] = 'ZIP code is required'

    // Validate billing address if different
    if (!useSameAddress) {
      if (!formData.billingAddress.street.trim()) newErrors['billingAddress.street'] = 'Street address is required'
      if (!formData.billingAddress.city.trim()) newErrors['billingAddress.city'] = 'City is required'
      if (!formData.billingAddress.state.trim()) newErrors['billingAddress.state'] = 'State is required'
      if (!formData.billingAddress.zipCode.trim()) newErrors['billingAddress.zipCode'] = 'ZIP code is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (!user) {
      router.push('/auth/signin')
      return
    }

    try {
      const orderData = {
        shippingAddress: formData.shippingAddress,
        billingAddress: useSameAddress ? formData.shippingAddress : formData.billingAddress,
        paymentMethod: formData.paymentMethod,
        shippingMethod: formData.shippingMethod,
        notes: formData.notes,
      }

      const order = await createOrder(orderData)
      
      if (order) {
        onSuccess?.(order)
        router.push(`/payment/${order.id}`)
      }
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:text-blue-800"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Address */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="shippingAddress.street" className="block text-sm font-medium text-gray-700">
              Street Address *
            </label>
            <input
              type="text"
              id="shippingAddress.street"
              name="shippingAddress.street"
              value={formData.shippingAddress.street}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors['shippingAddress.street'] ? 'border-red-300' : ''
              }`}
              placeholder="123 Main St"
            />
            {errors['shippingAddress.street'] && (
              <p className="mt-1 text-sm text-red-600">{errors['shippingAddress.street']}</p>
            )}
          </div>

          <div>
            <label htmlFor="shippingAddress.city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              id="shippingAddress.city"
              name="shippingAddress.city"
              value={formData.shippingAddress.city}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors['shippingAddress.city'] ? 'border-red-300' : ''
              }`}
              placeholder="New York"
            />
            {errors['shippingAddress.city'] && (
              <p className="mt-1 text-sm text-red-600">{errors['shippingAddress.city']}</p>
            )}
          </div>

          <div>
            <label htmlFor="shippingAddress.state" className="block text-sm font-medium text-gray-700">
              State *
            </label>
            <input
              type="text"
              id="shippingAddress.state"
              name="shippingAddress.state"
              value={formData.shippingAddress.state}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors['shippingAddress.state'] ? 'border-red-300' : ''
              }`}
              placeholder="NY"
            />
            {errors['shippingAddress.state'] && (
              <p className="mt-1 text-sm text-red-600">{errors['shippingAddress.state']}</p>
            )}
          </div>

          <div>
            <label htmlFor="shippingAddress.zipCode" className="block text-sm font-medium text-gray-700">
              ZIP Code *
            </label>
            <input
              type="text"
              id="shippingAddress.zipCode"
              name="shippingAddress.zipCode"
              value={formData.shippingAddress.zipCode}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors['shippingAddress.zipCode'] ? 'border-red-300' : ''
              }`}
              placeholder="10001"
            />
            {errors['shippingAddress.zipCode'] && (
              <p className="mt-1 text-sm text-red-600">{errors['shippingAddress.zipCode']}</p>
            )}
          </div>

          <div>
            <label htmlFor="shippingAddress.country" className="block text-sm font-medium text-gray-700">
              Country *
            </label>
            <select
              id="shippingAddress.country"
              name="shippingAddress.country"
              value={formData.shippingAddress.country}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="useSameAddress"
            checked={useSameAddress}
            onChange={(e) => setUseSameAddress(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="useSameAddress" className="ml-2 block text-sm text-gray-900">
            Use same address for billing
          </label>
        </div>

        {!useSameAddress && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="billingAddress.street" className="block text-sm font-medium text-gray-700">
                  Street Address *
                </label>
                <input
                  type="text"
                  id="billingAddress.street"
                  name="billingAddress.street"
                  value={formData.billingAddress.street}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors['billingAddress.street'] ? 'border-red-300' : ''
                  }`}
                  placeholder="123 Main St"
                />
                {errors['billingAddress.street'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['billingAddress.street']}</p>
                )}
              </div>

              <div>
                <label htmlFor="billingAddress.city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="billingAddress.city"
                  name="billingAddress.city"
                  value={formData.billingAddress.city}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors['billingAddress.city'] ? 'border-red-300' : ''
                  }`}
                  placeholder="New York"
                />
                {errors['billingAddress.city'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['billingAddress.city']}</p>
                )}
              </div>

              <div>
                <label htmlFor="billingAddress.state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  id="billingAddress.state"
                  name="billingAddress.state"
                  value={formData.billingAddress.state}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors['billingAddress.state'] ? 'border-red-300' : ''
                  }`}
                  placeholder="NY"
                />
                {errors['billingAddress.state'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['billingAddress.state']}</p>
                )}
              </div>

              <div>
                <label htmlFor="billingAddress.zipCode" className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="billingAddress.zipCode"
                  name="billingAddress.zipCode"
                  value={formData.billingAddress.zipCode}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors['billingAddress.zipCode'] ? 'border-red-300' : ''
                  }`}
                  placeholder="10001"
                />
                {errors['billingAddress.zipCode'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['billingAddress.zipCode']}</p>
                )}
              </div>

              <div>
                <label htmlFor="billingAddress.country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <select
                  id="billingAddress.country"
                  name="billingAddress.country"
                  value={formData.billingAddress.country}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment & Shipping */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment & Shipping</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <div>
            <label htmlFor="shippingMethod" className="block text-sm font-medium text-gray-700">
              Shipping Method *
            </label>
            <select
              id="shippingMethod"
              name="shippingMethod"
              value={formData.shippingMethod}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="standard">Standard Shipping (5-7 days) - $9.99</option>
              <option value="express">Express Shipping (2-3 days) - $15.99</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Order Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Any special instructions for your order..."
            />
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({summary.itemCount} items)</span>
            <span className="font-medium">${summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">${summary.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              ${formData.shippingMethod === 'express' ? '15.99' : '9.99'}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>
                ${(summary.subtotal + summary.tax + (formData.shippingMethod === 'express' ? 15.99 : 9.99)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </form>
  )
}
