'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import {
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    DollarSign,
    LineChart,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Users
} from 'lucide-react'
import { useEffect } from 'react'
import MetricCard from './MetricCard'
import ProductChart from './ProductChart'
import RecentOrdersTable from './RecentOrdersTable'
import SalesChart from './SalesChart'
import TopProductsTable from './TopProductsTable'
import UserChart from './UserChart'

const AnalyticsDashboard = () => {
  const {
    dashboardOverview,
    isLoading,
    error,
    fetchDashboardOverview,
  } = useAnalyticsStore()

  useEffect(() => {
    fetchDashboardOverview()
  }, [fetchDashboardOverview])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Error loading analytics</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchDashboardOverview}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardOverview) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  const {
    overview,
    today,
    thisWeek,
    thisMonth,
    status,
    recentOrders,
    topProducts,
    quickStats,
  } = dashboardOverview

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your e-commerce performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={overview.totalRevenue}
          format="currency"
          change={quickStats.revenueGrowth}
          changeType={quickStats.revenueGrowth >= 0 ? 'increase' : 'decrease'}
          icon={<DollarSign />}
          description="All-time revenue"
        />
        <MetricCard
          title="Total Orders"
          value={overview.totalOrders}
          change={quickStats.orderGrowth}
          changeType={quickStats.orderGrowth >= 0 ? 'increase' : 'decrease'}
          icon={<ShoppingCart />}
          description="All-time orders"
        />
        <MetricCard
          title="Total Users"
          value={overview.totalUsers}
          change={quickStats.userGrowth}
          changeType={quickStats.userGrowth >= 0 ? 'increase' : 'decrease'}
          icon={<Users />}
          description="Registered users"
        />
        <MetricCard
          title="Conversion Rate"
          value={overview.conversionRate}
          format="percentage"
          icon={<TrendingUp />}
          description="Orders per user"
        />
      </div>

      {/* Today's Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Today's Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${today.revenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Revenue</div>
              <div className="flex items-center justify-center mt-1">
                {today.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-xs ml-1 ${today.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {today.revenueGrowth >= 0 ? '+' : ''}{today.revenueGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {today.orders.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Orders</div>
              <div className="flex items-center justify-center mt-1">
                {today.orderGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-xs ml-1 ${today.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {today.orderGrowth >= 0 ? '+' : ''}{today.orderGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {today.users.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">New Users</div>
              <div className="flex items-center justify-center mt-1">
                {today.userGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-xs ml-1 ${today.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {today.userGrowth >= 0 ? '+' : ''}{today.userGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {status.pendingOrders}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {status.completedOrders}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {status.lowStockProducts}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>Recent Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentOrdersTable orders={recentOrders} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Top Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopProductsTable products={topProducts} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <SalesChart />
        </TabsContent>

        <TabsContent value="users">
          <UserChart />
        </TabsContent>

        <TabsContent value="products">
          <ProductChart />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsDashboard
