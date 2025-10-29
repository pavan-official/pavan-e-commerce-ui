'use client'

import ProductForm from '@/components/ProductForm'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  costPrice?: number
  sku: string
  barcode?: string
  quantity: number
  lowStockThreshold: number
  categoryId: string
  images: string[]
  thumbnail?: string
  isActive: boolean
  isFeatured: boolean
  isDigital: boolean
  weight?: number
  length?: number
  width?: number
  height?: number
  metaTitle?: string
  metaDescription?: string
}

export default function NewProductPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isLoading) return
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchCategories()
  }, [user, isLoading, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch categories')
      }
    } catch (_error) {
      setError('An error occurred while fetching categories')
    }
  }

  const handleSubmit = async (productData: Product) => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/products')
      } else {
        setError(data.error?.message || 'Failed to create product')
      }
    } catch (_error) {
      setError('An error occurred while creating the product')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !categories.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Product</h1>
        <p className="mt-2 text-sm text-gray-700">
          Add a new product to your catalog
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      <ProductForm
        categories={categories}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}
