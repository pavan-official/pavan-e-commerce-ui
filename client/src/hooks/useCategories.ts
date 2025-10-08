import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  parentId?: string
  children?: Category[]
  _count?: {
    products: number
  }
}

interface UseCategoriesReturn {
  categories: Category[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data || [])
      } else {
        setError(data.error?.message || 'Failed to fetch categories')
      }
    } catch (err) {
      setError('An error occurred while fetching categories')
      console.error('Categories fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  }
}
