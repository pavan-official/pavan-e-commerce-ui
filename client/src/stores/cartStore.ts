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
          const response = await fetch('/api/cart')
          const data = await response.json()

          if (data.success) {
            set({
              items: data.data.items,
              summary: data.data.summary,
              isLoading: false,
            })
          } else {
            set({
              error: data.error?.message || 'Failed to fetch cart',
              isLoading: false,
            })
          }
        } catch (error) {
          set({
            error: 'An error occurred while fetching cart',
            isLoading: false,
          })
        }
      },

      addToCart: async (productId: string, variantId?: string, quantity = 1) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId,
              variantId,
              quantity,
            }),
          })

          const data = await response.json()

          if (data.success) {
            // Refresh cart after adding
            await get().fetchCart()
          } else {
            set({
              error: data.error?.message || 'Failed to add item to cart',
              isLoading: false,
            })
          }
        } catch (error) {
          set({
            error: 'An error occurred while adding item to cart',
            isLoading: false,
          })
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
        } catch (error) {
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
        } catch (error) {
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