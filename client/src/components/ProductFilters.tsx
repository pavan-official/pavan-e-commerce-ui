'use client'

import { useCategories } from '@/hooks/useCategories'
import { useSearchStore } from '@/stores/searchStore'
import { useEffect, useState } from 'react'

interface ProductFiltersProps {
  className?: string
  onFiltersChange?: (filters: any) => void
}

export default function ProductFilters({ 
  className = "",
  onFiltersChange 
}: ProductFiltersProps) {
  const { 
    filters, 
    setFilters, 
    applyFilters, 
    clearFilters,
    aggregations 
  } = useSearchStore()
  
  const { categories, isLoading: categoriesLoading } = useCategories()
  
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || 0,
    max: filters.maxPrice || 1000,
  })
  
  const [localFilters, setLocalFilters] = useState(filters)

  // Update local filters when store filters change
  useEffect(() => {
    setLocalFilters(filters)
    setPriceRange({
      min: filters.minPrice || 0,
      max: filters.maxPrice || 1000,
    })
  }, [filters])

  // Update aggregations when available
  useEffect(() => {
    if (aggregations?.price) {
      setPriceRange(prev => ({
        min: prev.min || aggregations.price.min,
        max: prev.max || aggregations.price.max,
      }))
    }
  }, [aggregations])

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
    // Apply filters immediately
    applyFilters()
  }

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const newPriceRange = { ...priceRange, [type]: value }
    setPriceRange(newPriceRange)
    
    const newFilters = {
      ...localFilters,
      minPrice: newPriceRange.min,
      maxPrice: newPriceRange.max,
    }
    setLocalFilters(newFilters)
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
    // Apply filters immediately
    applyFilters()
  }

  const handleApplyFilters = () => {
    applyFilters()
  }

  const handleClearFilters = () => {
    clearFilters()
    setPriceRange({
      min: aggregations?.price?.min || 0,
      max: aggregations?.price?.max || 1000,
    })
    onFiltersChange?.({})
  }

  const handleCategoryToggle = (categorySlug: string) => {
    const newCategory = localFilters.category === categorySlug ? undefined : categorySlug
    handleFilterChange('category', newCategory)
  }

  const handleRatingChange = (rating: number) => {
    const newRating = localFilters.rating === rating ? undefined : rating
    handleFilterChange('rating', newRating)
  }

  const renderStarRating = (rating: number, isSelected: boolean) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? isSelected ? 'text-yellow-400' : 'text-yellow-300'
                : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">
          {rating}+ stars
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Price Range Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                <input
                  type="number"
                  min={aggregations?.price?.min || 0}
                  max={aggregations?.price?.max || 1000}
                  value={priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                <input
                  type="number"
                  min={aggregations?.price?.min || 0}
                  max={aggregations?.price?.max || 1000}
                  value={priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Max"
                />
              </div>
            </div>
            
            {/* Price Range Slider */}
            <div className="px-2">
              <input
                type="range"
                min={aggregations?.price?.min || 0}
                max={aggregations?.price?.max || 1000}
                value={priceRange.min}
                onChange={(e) => handlePriceRangeChange('min', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    ((priceRange.min - (aggregations?.price?.min || 0)) / 
                     ((aggregations?.price?.max || 1000) - (aggregations?.price?.min || 0))) * 100
                  }%, #e5e7eb ${
                    ((priceRange.min - (aggregations?.price?.min || 0)) / 
                     ((aggregations?.price?.max || 1000) - (aggregations?.price?.min || 0))) * 100
                  }%, #e5e7eb 100%)`
                }}
              />
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              ${priceRange.min} - ${priceRange.max}
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categoriesLoading ? (
              <div className="text-sm text-gray-500">Loading categories...</div>
            ) : (
              categories.map((category) => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={localFilters.category === category.slug}
                    onChange={() => handleCategoryToggle(category.slug)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {category.name}
                    {aggregations?.categories && (
                      <span className="ml-1 text-gray-500">
                        ({aggregations.categories.find(c => c.slug === category.slug)?.count || 0})
                      </span>
                    )}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Rating</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={localFilters.rating === rating}
                  onChange={() => handleRatingChange(rating)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-2">
                  {renderStarRating(rating, localFilters.rating === rating)}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Stock Availability Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Availability</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.inStock === true}
                onChange={(e) => handleFilterChange('inStock', e.target.checked ? true : undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">In Stock</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.inStock === false}
                onChange={(e) => handleFilterChange('inStock', e.target.checked ? false : undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Out of Stock</span>
            </label>
          </div>
        </div>

        {/* Featured Products Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Special</h4>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.isFeatured === true}
              onChange={(e) => handleFilterChange('isFeatured', e.target.checked ? true : undefined)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Featured Products</span>
          </label>
        </div>

        {/* Sort Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sort By</h4>
          <select
            value={localFilters.sortBy || 'createdAt'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="price">Price Low to High</option>
            <option value="rating">Highest Rated</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sort Order</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="sortOrder"
                checked={localFilters.sortOrder === 'asc'}
                onChange={() => handleFilterChange('sortOrder', 'asc')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Ascending</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="sortOrder"
                checked={localFilters.sortOrder === 'desc'}
                onChange={() => handleFilterChange('sortOrder', 'desc')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Descending</span>
            </label>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleApplyFilters}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}