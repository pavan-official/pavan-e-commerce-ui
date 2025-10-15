'use client'

import { CheckCircle, Clock, Eye, Trash2, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import RatingDisplay from '../RatingDisplay'

interface Review {
  id: string
  rating: number
  title: string
  content: string
  isApproved: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
  product: {
    id: string
    name: string
    slug: string
    thumbnail?: string
  }
  helpfulCount: number
}

interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

interface ReviewModerationDashboardProps {
  className?: string
}

export default function ReviewModerationDashboard({ 
  className = '' 
}: ReviewModerationDashboardProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [selectedStatus, currentPage])

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/admin/reviews?status=${selectedStatus}&page=${currentPage}&limit=20`
      )
      const data = await response.json()
      
      if (data.success) {
        setReviews(data.data.reviews)
        setStats(data.data.stats)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        setError(data.error?.message || 'Failed to fetch reviews')
      }
    } catch (_err) {
      setError('An error occurred while fetching reviews')
    } finally {
      setIsLoading(false)
    }
  }

  const moderateReview = async (reviewId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason: action === 'reject' ? rejectionReason : undefined,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh reviews
        await fetchReviews()
        setShowModal(false)
        setSelectedReview(null)
        setRejectionReason('')
      } else {
        setError(data.error?.message || 'Failed to moderate review')
      }
    } catch (_err) {
      setError('An error occurred while moderating review')
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh reviews
        await fetchReviews()
      } else {
        setError(data.error?.message || 'Failed to delete review')
      }
    } catch (_err) {
      setError('An error occurred while deleting review')
    }
  }

  const openModerationModal = (review: Review) => {
    setSelectedReview(review)
    setShowModal(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!session) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
          <p className="text-gray-600">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
        <p className="mt-2 text-gray-600">
          Manage and moderate product reviews
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex space-x-4">
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {getStatusIcon(status)}
                <span className="capitalize">{status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Reviews Found</h3>
          <p className="mt-2 text-sm text-gray-500">
            No {selectedStatus} reviews at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedStatus)}`}>
                        {selectedStatus}
                      </span>
                    </div>

                    <h5 className="text-lg font-medium text-gray-900 mb-2">
                      {review.title}
                    </h5>

                    <p className="text-gray-700 mb-4">{review.content}</p>

                    {/* Product Info */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Product:</span>
                      <span className="font-medium">{review.product.name}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {selectedStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => moderateReview(review.id, 'approve')}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                        title="Approve Review"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openModerationModal(review)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        title="Reject Review"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Review
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this review:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedReview(null)
                    setRejectionReason('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => moderateReview(selectedReview.id, 'reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
