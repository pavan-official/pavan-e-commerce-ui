import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    price: number
    thumbnail?: string
    category: {
      name: string
    }
    _count: {
      reviews: number
    }
  }
  createdAt: string
}

interface WishlistState {
  items: WishlistItem[]
  isLoading: boolean
  error: string | null
}

interface WishlistActions {
  // Wishlist operations
  fetchWishlist: () => Promise<void>
  addToWishlist: (productId: string) => Promise<void>
  removeFromWishlist: (itemId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  
  // Local state management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setItems: (items: WishlistItem[]) => void
}

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isLoading: false,
      error: null,

      // Actions
      fetchWishlist: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/wishlist')
          const data = await response.json()

          if (data.success) {
            set({
              items: data.data,
              isLoading: false,
            })
          } else {
            set({
              error: data.error?.message || 'Failed to fetch wishlist',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while fetching wishlist',
            isLoading: false,
          })
        }
      },

      addToWishlist: async (productId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId }),
          })

          const data = await response.json()

          if (data.success) {
            // Refresh wishlist after adding
            await get().fetchWishlist()
          } else {
            set({
              error: data.error?.message || 'Failed to add item to wishlist',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while adding item to wishlist',
            isLoading: false,
          })
        }
      },

      removeFromWishlist: async (itemId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/wishlist/${itemId}`, {
            method: 'DELETE',
          })

          const data = await response.json()

          if (data.success) {
            // Refresh wishlist after removing
            await get().fetchWishlist()
          } else {
            set({
              error: data.error?.message || 'Failed to remove item from wishlist',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while removing item from wishlist',
            isLoading: false,
          })
        }
      },

      isInWishlist: (productId: string) => {
        const { items } = get()
        return items.some(item => item.productId === productId)
      },

      // Local state setters
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setItems: (items: WishlistItem[]) => set({ items }),
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
)
