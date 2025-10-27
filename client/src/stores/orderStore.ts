import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OrderItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    thumbnail?: string
    category: {
      name: string
    }
  }
  variant?: {
    id: string
    name: string
  }
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  method: string
  provider: string
  providerId: string
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  shippingAddress: any
  billingAddress: any
  paymentStatus: string
  paymentMethod: string
  shippingMethod: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  notes?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  payments: Payment[]
  user?: {
    id: string
    name: string
    email: string
    phone?: string
  }
}

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
}

interface OrderActions {
  // Order operations
  fetchOrders: (filters?: { status?: string; page?: number; limit?: number }) => Promise<void>
  fetchOrder: (orderId: string) => Promise<void>
  createOrder: (orderData: any) => Promise<Order | null>
  updateOrder: (orderId: string, updates: any) => Promise<void>
  
  // Local state management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setOrders: (orders: Order[]) => void
  setCurrentOrder: (order: Order | null) => void
  clearCurrentOrder: () => void
}

export const useOrderStore = create<OrderState & OrderActions>()(
  persist(
    (set, get) => ({
      // Initial state
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,

      // Actions
      fetchOrders: async (filters = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const params = new URLSearchParams()
          if (filters.status) params.append('status', filters.status)
          if (filters.page) params.append('page', filters.page.toString())
          if (filters.limit) params.append('limit', filters.limit.toString())

          const response = await fetch(`/api/orders/?${params.toString()}`)
          const data = await response.json()

          if (data.success) {
            set({
              orders: data.data,
              isLoading: false,
            })
          } else {
            set({
              error: data.error?.message || 'Failed to fetch orders',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while fetching orders',
            isLoading: false,
          })
        }
      },

      fetchOrder: async (orderId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/orders/${orderId}/`)
          const data = await response.json()

          if (data.success) {
            set({
              currentOrder: data.data,
              isLoading: false,
            })
          } else {
            set({
              error: data.error?.message || 'Failed to fetch order',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while fetching order',
            isLoading: false,
          })
        }
      },

      createOrder: async (orderData: any) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/orders/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
          })

          const data = await response.json()

          if (data.success) {
            const newOrder = data.data
            set({
              currentOrder: newOrder,
              orders: [newOrder, ...get().orders],
              isLoading: false,
            })
            return newOrder
          } else {
            set({
              error: data.error?.message || 'Failed to create order',
              isLoading: false,
            })
            return null
          }
        } catch (_error) {
          set({
            error: 'An error occurred while creating order',
            isLoading: false,
          })
          return null
        }
      },

      updateOrder: async (orderId: string, updates: any) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          })

          const data = await response.json()

          if (data.success) {
            const updatedOrder = data.data
            set({
              currentOrder: updatedOrder,
              orders: get().orders.map(order => 
                order.id === orderId ? updatedOrder : order
              ),
              isLoading: false,
            })
          } else {
            set({
              error: data.error?.message || 'Failed to update order',
              isLoading: false,
            })
          }
        } catch (_error) {
          set({
            error: 'An error occurred while updating order',
            isLoading: false,
          })
        }
      },

      // Local state setters
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setOrders: (orders: Order[]) => set({ orders }),
      setCurrentOrder: (order: Order | null) => set({ currentOrder: order }),
      clearCurrentOrder: () => set({ currentOrder: null }),
    }),
    {
      name: 'order-storage',
      partialize: (state) => ({
        orders: state.orders,
        currentOrder: state.currentOrder,
      }),
    }
  )
)
