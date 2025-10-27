'use client'

import { useCustomAuth } from '@/hooks/useCustomAuth'
import { useCartStore } from '@/stores/cartStore'
import Image from 'next/image'
import Link from 'next/link'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { user } = useCustomAuth()
  const { items, summary, isLoading, error, updateQuantity, removeFromCart } = useCartStore()

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    await updateQuantity(itemId, newQuantity)
  }

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({summary.itemCount})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {!user ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Please sign in to view your cart</p>
                <Link
                  href="/auth/custom-signin"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign In
                </Link>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                <p className="mt-1 text-sm text-gray-500">Start adding some items to your cart.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const price = Number(item.variant?.price || item.product.price)
                  const total = price * item.quantity
                  
                  return (
                    <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {item.product.thumbnail ? (
                          <Image
                            src={item.product.thumbnail}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-500">
                              {item.product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h3>
                        {item.variant && (
                          <p className="text-sm text-gray-500">{item.variant.name}</p>
                        )}
                        <p className="text-sm text-gray-500">{item.product.category.name}</p>
                        <p className="text-sm font-medium text-gray-900">
                          ${price.toFixed(2)} × {item.quantity} = ${total.toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isLoading}
                          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={isLoading}
                          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isLoading}
                        className="text-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {user && items.length > 0 && (
            <div className="border-t px-6 py-4">
              {/* Summary */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${Number(summary.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${Number(summary.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${Number(summary.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  href="/cart"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
