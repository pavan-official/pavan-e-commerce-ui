import { create } from 'zustand'

interface Review {
  id: string
  productId: string
  userId: string
  orderId?: string
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
  helpfulCount: number
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
}

interface ReviewPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface ReviewState {
  // Data
  reviews: Review[]
  stats: ReviewStats | null
  pagination: ReviewPagination | null
  currentReview: Review | null
  
  // UI state
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  
  // Filters
  filters: {
    page: number
    limit: number
    sortBy: 'createdAt' | 'rating' | 'helpful'
    sortOrder: 'asc' | 'desc'
    rating?: number
    approvedOnly: boolean
  }
}

interface ReviewActions {
  // Data operations
  fetchReviews: (productId: string, filters?: Partial<ReviewState['filters']>) => Promise<void>
  fetchReview: (productId: string, reviewId: string) => Promise<void>
  createReview: (productId: string, reviewData: {
    rating: number
    title: string
    content: string
    orderId?: string
  }) => Promise<void>
  updateReview: (productId: string, reviewId: string, reviewData: {
    rating?: number
    title?: string
    content?: string
  }) => Promise<void>
  deleteReview: (productId: string, reviewId: string) => Promise<void>
  voteHelpful: (productId: string, reviewId: string, isHelpful: boolean) => Promise<void>
  removeVote: (productId: string, reviewId: string) => Promise<void>
  
  // Filter operations
  setFilters: (filters: Partial<ReviewState['filters']>) => void
  setPage: (page: number) => void
  setSorting: (sortBy: ReviewState['filters']['sortBy'], sortOrder: ReviewState['filters']['sortOrder']) => void
  setRatingFilter: (rating?: number) => void
  
  // Local state management
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

const initialFilters: ReviewState['filters'] = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  approvedOnly: true,
}

export const useReviewStore = create<ReviewState & ReviewActions>((set, get) => ({
  // Initial state
  reviews: [],
  stats: null,
  pagination: null,
  currentReview: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  filters: { ...initialFilters },

  // Actions
  fetchReviews: async (productId: string, newFilters?: Partial<ReviewState['filters']>) => {
    const { filters } = get()
    const searchFilters = { ...filters, ...newFilters }
    
    set({ isLoading: true, error: null })
    
    try {
      const params = new URLSearchParams()
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value) !== '') {
          params.append(key, String(value))
        }
      })
      
      const response = await fetch(`/api/products/${productId}/reviews/?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        set({
          reviews: data.data.reviews,
          stats: data.data.stats,
          pagination: data.data.pagination,
          filters: searchFilters,
          isLoading: false,
        })
      } else {
        set({
          error: data.error?.message || 'Failed to fetch reviews',
          isLoading: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while fetching reviews',
        isLoading: false,
      })
    }
  },

  fetchReview: async (productId: string, reviewId: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}/`)
      const data = await response.json()
      
      if (data.success) {
        set({
          currentReview: data.data,
          isLoading: false,
        })
      } else {
        set({
          error: data.error?.message || 'Failed to fetch review',
          isLoading: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while fetching review',
        isLoading: false,
      })
    }
  },

  createReview: async (productId: string, reviewData) => {
    set({ isSubmitting: true, error: null })
    
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh reviews to show the new one
        await get().fetchReviews(productId)
        set({ isSubmitting: false })
      } else {
        set({
          error: data.error?.message || 'Failed to create review',
          isSubmitting: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while creating review',
        isSubmitting: false,
      })
    }
  },

  updateReview: async (productId: string, reviewId: string, reviewData) => {
    set({ isSubmitting: true, error: null })
    
    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh reviews to show the updated one
        await get().fetchReviews(productId)
        set({ isSubmitting: false })
      } else {
        set({
          error: data.error?.message || 'Failed to update review',
          isSubmitting: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while updating review',
        isSubmitting: false,
      })
    }
  },

  deleteReview: async (productId: string, reviewId: string) => {
    set({ isSubmitting: true, error: null })
    
    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove from local state
        set(state => ({
          reviews: state.reviews.filter(review => review.id !== reviewId),
          isSubmitting: false,
        }))
        
        // Refresh reviews to update stats
        await get().fetchReviews(productId)
      } else {
        set({
          error: data.error?.message || 'Failed to delete review',
          isSubmitting: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while deleting review',
        isSubmitting: false,
      })
    }
  },

  voteHelpful: async (productId: string, reviewId: string, isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHelpful }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update local state
        set(state => ({
          reviews: state.reviews.map(review =>
            review.id === reviewId
              ? { ...review, helpfulCount: review.helpfulCount + (isHelpful ? 1 : -1) }
              : review
          ),
        }))
      } else {
        set({ error: data.error?.message || 'Failed to vote on review' })
      }
    } catch (_error) {
      set({ error: 'An error occurred while voting on review' })
    }
  },

  removeVote: async (productId: string, reviewId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}/helpful`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update local state - we don't know if it was helpful or not, so we'll refresh
        await get().fetchReviews(productId)
      } else {
        set({ error: data.error?.message || 'Failed to remove vote' })
      }
    } catch (_error) {
      set({ error: 'An error occurred while removing vote' })
    }
  },

  // Filter operations
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }))
  },

  setPage: (page) => {
    set(state => ({
      filters: { ...state.filters, page },
    }))
  },

  setSorting: (sortBy, sortOrder) => {
    set(state => ({
      filters: { ...state.filters, sortBy, sortOrder },
    }))
  },

  setRatingFilter: (rating) => {
    set(state => ({
      filters: { ...state.filters, rating },
    }))
  },

  // Local state setters
  setLoading: (loading) => set({ isLoading: loading }),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
