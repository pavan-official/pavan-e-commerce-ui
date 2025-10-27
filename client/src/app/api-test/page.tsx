'use client'

import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  price: number
  description: string
  category: {
    name: string
  }
  _count: {
    reviews: number
  }
}

interface ApiResponse {
  success: boolean
  data: Product[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: {
    code: string
    message: string
  }
}

export default function ApiTestPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        const data: ApiResponse = await response.json()
        
        if (data.success) {
          setProducts(data.data)
        } else {
          setError(data.error?.message || 'Failed to fetch products')
        }
      } catch (err) {
        setError('Network error occurred')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">API Test Failed</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Make sure the database is running and seeded with data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Test Successful!</h1>
          <p className="text-gray-600">
            Database connection is working and {products.length} products were fetched.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {product.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">
                  ${product.price}
                </span>
                <span className="text-sm text-gray-500">
                  {product.category.name}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {product._count.reviews} reviews
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Products Found
            </h2>
            <p className="text-gray-600">
              The database is connected but no products were found.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Run <code className="bg-gray-100 px-2 py-1 rounded">npm run db:seed</code> to populate the database.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
