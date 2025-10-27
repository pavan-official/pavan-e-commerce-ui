import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    thumbnail?: string
    category: {
      name: string
    }
  }
  variant?: {
    id: string
    name: string
    price?: number
  }
}

interface CartSummary {
  subtotal: number
  tax: number
  total: number
  itemCount: number
}

interface CartState {
  items: CartItem[]
  summary: CartSummary
  isLoading: boolean
  error: string | null
}

interface CartActions {
  // Cart operations
  fetchCart: () => Promise<void>
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => void
  
  // Local state management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setItems: (items: CartItem[]) => void
  setSummary: (summary: CartSummary) => void
}

const initialSummary: CartSummary = {
  subtotal: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      summary: initialSummary,
      isLoading: false,
      error: null,

      // Actions
      fetchCart: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/cart/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Ensure cookies are sent
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const data = await response.json()

          if (data.success) {
            set({
              items: data.data.items || [],
              summary: data.data.summary || initialSummary,
              isLoading: false,
            })
          } else {
            set({
              error: data.error?.message || 'Failed to fetch cart',
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Cart fetch error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred while fetching cart',
            isLoading: false,
          })
        }
      },

      addToCart: async (productId: string, variantId?: string, quantity = 1) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/cart/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Ensure cookies are sent
            body: JSON.stringify({
              productId,
              variantId,
              quantity,
            }),
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()

          if (data.success) {
            // Always refresh cart from database to ensure consistency
            await get().fetchCart()
          } else {
            // Handle specific error cases with detailed messages
            let errorMessage = 'Failed to add item to cart'
            
            if (response.status === 401) {
              errorMessage = 'Please sign in to add items to cart'
            } else if (data.error?.code === 'PRODUCT_NOT_FOUND') {
              errorMessage = 'Product not found'
            } else if (data.error?.code === 'INSUFFICIENT_STOCK') {
              errorMessage = data.error.message || 'Insufficient stock'
            } else if (data.error?.code === 'VALIDATION_ERROR') {
              errorMessage = 'Invalid product data'
            } else if (data.error?.message) {
              errorMessage = data.error.message
            }
            
            set({
              error: errorMessage,
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Add to cart error:', error)
          set({
            error: error instanceof Error ? error.message : 'Network error. Please check your connection and try again.',
            isLoading: false,
          })
        }
      },

      addMultipleToCart: async (items: Array<{productId: string, variantId?: string, quantity: number}>) => {
        set({ isLoading: true, error: null })
        
        try {
          const results = []
          const errors = []
          
          // Add items sequentially to maintain order and handle errors properly
          for (const item of items) {
            try {
              const response = await fetch('/api/cart/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(item),
              })

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
              }

              const data = await response.json()
              
              if (data.success) {
                results.push({ success: true, item, data: data.data })
              } else {
                errors.push({ item, error: data.error?.message || 'Failed to add item' })
              }
            } catch (error) {
              errors.push({ 
                item, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              })
            }
          }
          
          // Refresh cart to get updated state
          await get().fetchCart()
          
          if (errors.length > 0) {
            set({
              error: `Some items could not be added: ${errors.map(e => e.error).join(', ')}`,
              isLoading: false,
            })
          } else {
            set({ isLoading: false, error: null })
          }
          
          return { results, errors }
        } catch (error) {
          console.error('Add multiple to cart error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred while adding items to cart',
            isLoading: false,
          })
          return { results: [], errors: [{ error: error instanceof Error ? error.message : 'Unknown error' }] }
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity }),
          })

          const data = await response.json()

          if (data.success) {
            // Refresh cart after updating
            await get().fetchCart()
          } else {
            set({
              error: data.error?.message || 'Failed to update cart item',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while updating cart item',
            isLoading: false,
          })
        }
      },

      removeFromCart: async (itemId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: 'DELETE',
          })

          const data = await response.json()

          if (data.success) {
            // Refresh cart after removing
            await get().fetchCart()
          } else {
            set({
              error: data.error?.message || 'Failed to remove item from cart',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while removing item from cart',
            isLoading: false,
          })
        }
      },

      clearCart: () => {
        set({
          items: [],
          summary: initialSummary,
          error: null,
        })
      },

      // Local state setters
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setItems: (items: CartItem[]) => set({ items }),
      setSummary: (summary: CartSummary) => set({ summary }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        summary: state.summary,
      }),
    }
  )
)