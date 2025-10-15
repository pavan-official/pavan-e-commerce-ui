import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { render, screen } from '@testing-library/react'

// Mock the analytics store
jest.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: jest.fn(),
}))

// Mock chart components
jest.mock('@/components/analytics/SalesChart', () => {
  return function MockSalesChart() {
    return <div data-testid="sales-chart">Sales Chart</div>
  }
})

jest.mock('@/components/analytics/UserChart', () => {
  return function MockUserChart() {
    return <div data-testid="user-chart">User Chart</div>
  }
})

jest.mock('@/components/analytics/ProductChart', () => {
  return function MockProductChart() {
    return <div data-testid="product-chart">Product Chart</div>
  }
})

jest.mock('@/components/analytics/RecentOrdersTable', () => {
  return function MockRecentOrdersTable() {
    return <div data-testid="recent-orders">Recent Orders</div>
  }
})

jest.mock('@/components/analytics/TopProductsTable', () => {
  return function MockTopProductsTable() {
    return <div data-testid="top-products">Top Products</div>
  }
})

const mockUseAnalyticsStore = useAnalyticsStore as jest.MockedGenericFunction<typeof useAnalyticsStore>

describe('AnalyticsDashboard', () => {
  const mockDashboardData = {
    overview: {
      totalRevenue: 10000,
      totalOrders: 100,
      totalUsers: 50,
      totalProducts: 25,
      activeProducts: 20,
      conversionRate: 2.0,
      averageOrderValue: 100,
    },
    today: {
      revenue: 500,
      orders: 5,
      users: 2,
      revenueGrowth: 10.5,
      orderGrowth: 5.0,
      userGrowth: 15.0,
    },
    thisWeek: {
      revenue: 2000,
      orders: 20,
      users: 10,
    },
    thisMonth: {
      revenue: 8000,
      orders: 80,
      users: 40,
    },
    status: {
      pendingOrders: 5,
      completedOrders: 90,
      lowStockProducts: 3,
    },
    recentOrders: [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        total: 150,
        status: 'COMPLETED',
        createdAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        firstItem: 'Test Product',
      },
    ],
    topProducts: [
      {
        productId: 'product-1',
        name: 'Test Product',
        price: 50,
        revenue: 500,
        quantitySold: 10,
      },
    ],
    quickStats: {
      revenueGrowth: 10.5,
      orderGrowth: 5.0,
      userGrowth: 15.0,
      conversionRate: 2.0,
      averageOrderValue: 100,
    },
  }

  const mockStore = {
    dashboardOverview: mockDashboardData,
    isLoading: false,
    error: null,
    fetchDashboardOverview: jest.fn(),
  }

  beforeEach(() => {
    mockUseAnalyticsStore.mockReturnValue(mockStore)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard with data', async () => {
    render(<AnalyticsDashboard />)

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview of your e-commerce performance')).toBeInTheDocument()
    
    // Check key metrics
    expect(screen.getByText('$10,000')).toBeInTheDocument() // Total Revenue
    expect(screen.getByText('100')).toBeInTheDocument() // Total Orders
    expect(screen.getByText('50')).toBeInTheDocument() // Total Users
    expect(screen.getByText('2.0%')).toBeInTheDocument() // Conversion Rate
  })

  it('shows today\'s performance', () => {
    render(<AnalyticsDashboard />)

    expect(screen.getByText('Today\'s Performance')).toBeInTheDocument()
    expect(screen.getByText('$500')).toBeInTheDocument() // Today's revenue
    expect(screen.getByText('5')).toBeInTheDocument() // Today's orders
    expect(screen.getByText('2')).toBeInTheDocument() // Today's users
  })

  it('shows status overview', () => {
    render(<AnalyticsDashboard />)

    expect(screen.getByText('Pending Orders')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Pending orders
    expect(screen.getByText('Completed Orders')).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument() // Completed orders
    expect(screen.getByText('Low Stock Products')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // Low stock
  })

  it('shows tabs for different analytics views', () => {
    render(<AnalyticsDashboard />)

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Sales')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseAnalyticsStore.mockReturnValue({
      ...mockStore,
      isLoading: true,
      dashboardOverview: null,
    })

    render(<AnalyticsDashboard />)

    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('shows error state', () => {
    mockUseAnalyticsStore.mockReturnValue({
      ...mockStore,
      isLoading: false,
      error: 'Failed to load analytics',
      dashboardOverview: null,
    })

    render(<AnalyticsDashboard />)

    expect(screen.getByText('Error loading analytics')).toBeInTheDocument()
    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('shows no data state', () => {
    mockUseAnalyticsStore.mockReturnValue({
      ...mockStore,
      isLoading: false,
      error: null,
      dashboardOverview: null,
    })

    render(<AnalyticsDashboard />)

    expect(screen.getByText('No analytics data available')).toBeInTheDocument()
  })

  it('calls fetchDashboardOverview on mount', () => {
    const mockFetch = jest.fn()
    mockUseAnalyticsStore.mockReturnValue({
      ...mockStore,
      fetchDashboardOverview: mockFetch,
    })

    render(<AnalyticsDashboard />)

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('handles retry on error', async () => {
    const mockFetch = jest.fn()
    mockUseAnalyticsStore.mockReturnValue({
      ...mockStore,
      isLoading: false,
      error: 'Network error',
      dashboardOverview: null,
      fetchDashboardOverview: mockFetch,
    })

    render(<AnalyticsDashboard />)

    const retryButton = screen.getByText('Try Again')
    retryButton.click()

    expect(mockFetch).toHaveBeenCalledTimes(2) // Once on mount, once on retry
  })
})
