'use client'

import { useCustomAuth } from '@/hooks/useCustomAuth'
import { useReviewStore } from '@/stores/reviewStore'
import { MoreVertical, ThumbsUp } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import RatingDisplay from './RatingDisplay'

interface ReviewListProps {
  productId: string
  className?: string
}

export default function ReviewList({ productId, className = '' }: ReviewListProps) {
  const { user, loading } = useCustomAuth()
  const {
    reviews,
    stats,
    pagination,
    isLoading,
    error,
    filters,
    fetchReviews,
    setPage,
    setSorting,
    setRatingFilter,
    voteHelpful,
    removeVote,
    deleteReview,
  } = useReviewStore()

  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchReviews(productId)
  }, [productId, fetchReviews])

  const handleSortChange = (sortBy: 'createdAt' | 'rating' | 'helpful', sortOrder: 'asc' | 'desc') => {
    setSorting(sortBy, sortOrder)
    fetchReviews(productId, { sortBy, sortOrder, page: 1 })
  }

  const handleRatingFilter = (rating?: number) => {
    setRatingFilter(rating)
    fetchReviews(productId, { rating, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setPage(page)
    fetchReviews(productId, { page })
  }

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const handleVoteHelpful = async (reviewId: string, isHelpful: boolean) => {
    await voteHelpful(productId, reviewId, isHelpful)
  }

  const _handleDeleteReview = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      await deleteReview(productId, reviewId)
    }
  }

  const renderRatingDistribution = () => {
    if (!stats?.ratingDistribution) return null

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating] || 0
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

          return (
            <div key={rating} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 w-8">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const renderFilters = () => (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Reviews</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="space-y-4">
          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleRatingFilter()}
                className={`px-3 py-1 rounded-full text-sm ${
                  !filters.rating
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingFilter(rating)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.rating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {rating}★
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSortChange('createdAt', 'desc')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.sortBy === 'createdAt' && filters.sortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => handleSortChange('rating', 'desc')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.sortBy === 'rating' && filters.sortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Highest Rated
              </button>
              <button
                onClick={() => handleSortChange('helpful', 'desc')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.sortBy === 'helpful' && filters.sortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Most Helpful
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null

    const pages = []
    const currentPage = pagination.page
    const totalPages = pagination.totalPages

    // Previous button
    if (pagination.hasPrev) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50"
        >
          Previous
        </button>
      )
    }

    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border ${
            i === currentPage
              ? 'text-blue-600 bg-blue-50 border-blue-500'
              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      )
    }

    // Next button
    if (pagination.hasNext) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50"
        >
          Next
        </button>
      )
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          {pagination.hasPrev && (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          {pagination.hasNext && (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </button>
          )}
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {Math.min((currentPage - 1) * pagination.limit + 1, pagination.total)}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> reviews
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {pages}
            </nav>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-red-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Reviews</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Review Stats */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <RatingDisplay
                rating={stats.averageRating}
                showNumber
                showCount
                reviewCount={stats.totalReviews}
                size="lg"
              />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageRating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {renderRatingDistribution()}
        </div>
      )}

      {/* Filters */}
      {renderFilters()}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Reviews Yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Be the first to review this product!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {review.user.image ? (
                      <Image
                        src={review.user.image}
                        alt={review.user.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {review.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {review.user.name}
                      </h4>
                      <RatingDisplay rating={review.rating} size="sm" />
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h5 className="text-lg font-medium text-gray-900 mb-2">
                      {review.title}
                    </h5>

                    <div className="text-gray-700">
                      {review.content.length > 200 && !expandedReviews.has(review.id) ? (
                        <>
                          <p>{review.content.substring(0, 200)}...</p>
                          <button
                            onClick={() => toggleReviewExpansion(review.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Read more
                          </button>
                        </>
                      ) : (
                        <>
                          <p>{review.content}</p>
                          {review.content.length > 200 && (
                            <button
                              onClick={() => toggleReviewExpansion(review.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Show less
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Helpful Votes */}
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleVoteHelpful(review.id, true)}
                          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>Helpful ({review.helpfulCount})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Actions */}
                {user?.id === review.userId && (
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {/* Add dropdown menu here for edit/delete */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  )
}
