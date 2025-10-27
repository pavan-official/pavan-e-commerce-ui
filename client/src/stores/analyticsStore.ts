import { create } from 'zustand'

interface DashboardOverview {
  overview: {
    totalRevenue: number
    totalOrders: number
    totalUsers: number
    totalProducts: number
    activeProducts: number
    conversionRate: number
    averageOrderValue: number
  }
  today: {
    revenue: number
    orders: number
    users: number
    revenueGrowth: number
    orderGrowth: number
    userGrowth: number
  }
  thisWeek: {
    revenue: number
    orders: number
    users: number
  }
  thisMonth: {
    revenue: number
    orders: number
    users: number
  }
  status: {
    pendingOrders: number
    completedOrders: number
    lowStockProducts: number
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
    user: {
      id: string
      name: string
      email: string
    }
    firstItem: string
  }>
  topProducts: Array<{
    productId: string
    name: string
    price: number
    thumbnail?: string
    revenue: number
    quantitySold: number
  }>
  quickStats: {
    revenueGrowth: number
    orderGrowth: number
    userGrowth: number
    conversionRate: number
    averageOrderValue: number
  }
}

interface SalesAnalytics {
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    period: {
      from: string
      to: string
    }
  }
  chartData: {
    salesByPeriod: Array<{
      revenue: number
      orders: number
      date: string
    }>
    salesByCategory: Array<{
      categoryId: string
      name: string
      revenue: number
      orders: number
    }>
    orderStatusDistribution: Record<string, number>
  }
  topProducts: Array<{
    productId: string
    name: string
    category: string
    quantity: number
    revenue: number
  }>
  metrics: {
    revenueGrowth: number
    orderGrowth: number
    conversionRate: number
  }
}

interface UserAnalytics {
  summary: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    retentionRate: number
    period: {
      from: string
      to: string
    }
  }
  metrics: {
    averageOrdersPerUser: number
    averageReviewsPerUser: number
    usersWithOrders: number
    usersWithReviews: number
    engagementLevels: {
      high: number
      medium: number
      low: number
    }
  }
  chartData: {
    registrationsByDay: Array<{
      date: string
      count: number
    }>
    roleDistribution: Record<string, number>
    engagementLevels: {
      high: number
      medium: number
      low: number
    }
  }
  topCustomers: Array<{
    userId: string
    totalSpent: number
    orderCount: number
    averageOrderValue: number
  }>
  insights: {
    userGrowth: number
    engagementTrend: number
    churnRate: number
  }
}

interface ProductAnalytics {
  summary: {
    totalProducts: number
    activeProducts: number
    totalRevenue: number
    totalUnitsSold: number
    averagePrice: number
    period: {
      from: string
      to: string
    }
  }
  topPerformers: {
    byRevenue: Array<{
      productId: string
      name: string
      category: string
      totalSold: number
      totalRevenue: number
      averageRating: number
      reviewCount: number
      stockLevel: number
      isActive: boolean
    }>
    byQuantity: Array<{
      productId: string
      name: string
      category: string
      totalSold: number
      totalRevenue: number
      averageRating: number
      reviewCount: number
      stockLevel: number
      isActive: boolean
    }>
    byRating: Array<{
      productId: string
      name: string
      category: string
      totalSold: number
      totalRevenue: number
      averageRating: number
      reviewCount: number
      stockLevel: number
      isActive: boolean
    }>
  }
  categoryAnalytics: Array<{
    categoryId: string
    name: string
    totalRevenue: number
    totalSold: number
    productCount: number
  }>
  inventoryStatus: {
    inStock: number
    lowStock: number
    outOfStock: number
    inactive: number
  }
  lowStockProducts: Array<{
    productId: string
    name: string
    category: string
    stock: number
    isActive: boolean
  }>
  insights: {
    revenueGrowth: number
    salesGrowth: number
    categoryTrends: any[]
  }
}

interface AnalyticsState {
  // Data
  dashboardOverview: DashboardOverview | null
  salesAnalytics: SalesAnalytics | null
  userAnalytics: UserAnalytics | null
  productAnalytics: ProductAnalytics | null
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Filters
  selectedPeriod: 'day' | 'week' | 'month' | 'year'
  selectedDateRange: {
    startDate: string | null
    endDate: string | null
  }
}

interface AnalyticsActions {
  // Data operations
  fetchDashboardOverview: () => Promise<void>
  fetchSalesAnalytics: (params?: {
    period?: 'day' | 'week' | 'month' | 'year'
    startDate?: string
    endDate?: string
    groupBy?: 'day' | 'week' | 'month'
  }) => Promise<void>
  fetchUserAnalytics: (params?: {
    period?: 'day' | 'week' | 'month' | 'year'
    startDate?: string
    endDate?: string
  }) => Promise<void>
  fetchProductAnalytics: (params?: {
    period?: 'day' | 'week' | 'month' | 'year'
    startDate?: string
    endDate?: string
    categoryId?: string
  }) => Promise<void>
  
  // Filter operations
  setPeriod: (period: 'day' | 'week' | 'month' | 'year') => void
  setDateRange: (startDate: string | null, endDate: string | null) => void
  
  // Local state management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>((set, get) => ({
  // Initial state
  dashboardOverview: null,
  salesAnalytics: null,
  userAnalytics: null,
  productAnalytics: null,
  isLoading: false,
  error: null,
  selectedPeriod: 'month',
  selectedDateRange: {
    startDate: null,
    endDate: null,
  },

  // Actions
  fetchDashboardOverview: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch('/api/analytics/dashboard/')
      const data = await response.json()
      
      if (data.success) {
        set({
          dashboardOverview: data.data,
          isLoading: false,
        })
      } else {
        set({
          error: data.error?.message || 'Failed to fetch dashboard overview',
          isLoading: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while fetching dashboard overview',
        isLoading: false,
      })
    }
  },

  fetchSalesAnalytics: async (params = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const { selectedPeriod, selectedDateRange } = get()
      const searchParams = new URLSearchParams()
      
      searchParams.set('period', params.period || selectedPeriod)
      if (params.startDate || selectedDateRange.startDate) {
        searchParams.set('startDate', params.startDate || selectedDateRange.startDate!)
      }
      if (params.endDate || selectedDateRange.endDate) {
        searchParams.set('endDate', params.endDate || selectedDateRange.endDate!)
      }
      if (params.groupBy) {
        searchParams.set('groupBy', params.groupBy)
      }
      
      const response = await fetch(`/api/analytics/sales?${searchParams.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        set({
          salesAnalytics: data.data,
          isLoading: false,
        })
      } else {
        set({
          error: data.error?.message || 'Failed to fetch sales analytics',
          isLoading: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while fetching sales analytics',
        isLoading: false,
      })
    }
  },

  fetchUserAnalytics: async (params = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const { selectedPeriod, selectedDateRange } = get()
      const searchParams = new URLSearchParams()
      
      searchParams.set('period', params.period || selectedPeriod)
      if (params.startDate || selectedDateRange.startDate) {
        searchParams.set('startDate', params.startDate || selectedDateRange.startDate!)
      }
      if (params.endDate || selectedDateRange.endDate) {
        searchParams.set('endDate', params.endDate || selectedDateRange.endDate!)
      }
      
      const response = await fetch(`/api/analytics/users?${searchParams.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        set({
          userAnalytics: data.data,
          isLoading: false,
        })
      } else {
        set({
          error: data.error?.message || 'Failed to fetch user analytics',
          isLoading: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while fetching user analytics',
        isLoading: false,
      })
    }
  },

  fetchProductAnalytics: async (params = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const { selectedPeriod, selectedDateRange } = get()
      const searchParams = new URLSearchParams()
      
      searchParams.set('period', params.period || selectedPeriod)
      if (params.startDate || selectedDateRange.startDate) {
        searchParams.set('startDate', params.startDate || selectedDateRange.startDate!)
      }
      if (params.endDate || selectedDateRange.endDate) {
        searchParams.set('endDate', params.endDate || selectedDateRange.endDate!)
      }
      if (params.categoryId) {
        searchParams.set('categoryId', params.categoryId)
      }
      
      const response = await fetch(`/api/analytics/products?${searchParams.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        set({
          productAnalytics: data.data,
          isLoading: false,
        })
      } else {
        set({
          error: data.error?.message || 'Failed to fetch product analytics',
          isLoading: false,
        })
      }
    } catch (_error) {
      set({
        error: 'An error occurred while fetching product analytics',
        isLoading: false,
      })
    }
  },

  // Filter operations
  setPeriod: (period) => {
    set({ selectedPeriod: period })
  },

  setDateRange: (startDate, endDate) => {
    set({
      selectedDateRange: {
        startDate,
        endDate,
      },
    })
  },

  // Local state setters
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
