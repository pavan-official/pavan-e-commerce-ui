'use client'

import AddToCartButton from '@/components/AddToCartButton'
import WishlistButton from '@/components/WishlistButton'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

export default function WishlistPage() {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: 'loading' }
  const _router = useRouter()
  const { items, isLoading, _error, fetchWishlist, removeFromWishlist } = useWishlistStore()
  const { addToCart } = useCartStore()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      _router.push('/auth/signin')
      return
    }

    fetchWishlist()
  }, [session, status, _router, fetchWishlist])

  const _handleRemoveFromWishlist = async (itemId: string) => {
    await removeFromWishlist(itemId)
  }

  const handleMoveToCart = async (productId: string) => {
    await addToCart(productId, undefined, 1)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Wishlist</h1>
        <p className="mt-2 text-sm text-gray-700">
          Save items you love for later
        </p>
      </div>

      {_error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{_error}</div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Start adding items you love to your wishlist.</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                {item.product.thumbnail ? (
                  <Image
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    width={300}
                    height={300}
                    className="h-48 w-full object-cover object-center group-hover:opacity-75"
                  />
                ) : (
                  <div className="h-48 w-full flex items-center justify-center">
                    <span className="text-4xl font-medium text-gray-500">
                      {item.product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Wishlist Button */}
              <div className="absolute top-2 right-2">
                <WishlistButton productId={item.product.id} size="sm" />
              </div>

              {/* Product Details */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  <Link href={`/products/${item.product.id}`}>
                    <span className="absolute inset-0" />
                    {item.product.name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-gray-500">{item.product.category.name}</p>
                
                {/* Reviews */}
                {item.product._count.reviews > 0 && (
                  <div className="mt-1 flex items-center">
                    <div className="flex items-center">
                      {[0, 1, 2, 3, 4].map((rating) => (
                        <svg
                          key={rating}
                          className="h-4 w-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-1 text-xs text-gray-500">
                      ({item.product._count.reviews})
                    </span>
                  </div>
                )}

                {/* Price */}
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  ${item.product.price.toFixed(2)}
                </p>

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <AddToCartButton
                    productId={item.product.id}
                    className="flex-1"
                  >
                    Add to Cart
                  </AddToCartButton>
                  <button
                    onClick={() => handleMoveToCart(item.product.id)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Move to cart"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
