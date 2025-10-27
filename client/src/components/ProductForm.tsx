'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Product {
  id?: string
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

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductFormProps {
  product?: Product
  categories: Category[]
  onSubmit: (data: Product) => Promise<void>
  loading?: boolean
}

export default function ProductForm({ product, categories, onSubmit, loading = false }: ProductFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Product>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    comparePrice: 0,
    costPrice: 0,
    sku: '',
    barcode: '',
    quantity: 0,
    lowStockThreshold: 5,
    categoryId: '',
    images: [],
    thumbnail: '',
    isActive: true,
    isFeatured: false,
    isDigital: false,
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    metaTitle: '',
    metaDescription: '',
    ...product,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      setFormData(product)
    }
  }, [product])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) || 0 : 
              value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }))
    handleInputChange(e)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.slug.trim()) newErrors.slug = 'Product slug is required'
    if (!formData.description.trim()) newErrors.description = 'Product description is required'
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.name ? 'border-red-300' : ''
              }`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Product Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.slug ? 'border-red-300' : ''
              }`}
              placeholder="product-slug"
            />
            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.description ? 'border-red-300' : ''
              }`}
              placeholder="Enter product description"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
              Short Description
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Brief product summary"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing & Inventory</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.price ? 'border-red-300' : ''
              }`}
              placeholder="0.00"
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="comparePrice" className="block text-sm font-medium text-gray-700">
              Compare Price
            </label>
            <input
              type="number"
              id="comparePrice"
              name="comparePrice"
              step="0.01"
              min="0"
              value={formData.comparePrice}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">
              Cost Price
            </label>
            <input
              type="number"
              id="costPrice"
              name="costPrice"
              step="0.01"
              min="0"
              value={formData.costPrice}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU *
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.sku ? 'border-red-300' : ''
              }`}
              placeholder="PROD-001"
            />
            {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="0"
              value={formData.quantity}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">
              Low Stock Threshold
            </label>
            <input
              type="number"
              id="lowStockThreshold"
              name="lowStockThreshold"
              min="0"
              value={formData.lowStockThreshold}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="5"
            />
          </div>
        </div>
      </div>

      {/* Category & Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category & Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.categoryId ? 'border-red-300' : ''
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                Featured
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDigital"
                name="isDigital"
                checked={formData.isDigital}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isDigital" className="ml-2 block text-sm text-gray-900">
                Digital Product
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}
