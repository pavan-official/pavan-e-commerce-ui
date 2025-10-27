import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { AlertTriangle, Package } from 'lucide-react'
import { useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const ProductChart = () => {
  const {
    productAnalytics,
    isLoading,
    error,
    fetchProductAnalytics,
    selectedPeriod,
    setPeriod,
  } = useAnalyticsStore()

  useEffect(() => {
    fetchProductAnalytics()
  }, [fetchProductAnalytics])

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
          <p className="text-red-600 mb-2">Error loading product data</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchProductAnalytics()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!productAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No product data available</p>
      </div>
    )
  }

  const { summary, topPerformers, categoryAnalytics, inventoryStatus, lowStockProducts } = productAnalytics

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const categoryData = categoryAnalytics.slice(0, 8).map((category, index) => ({
    ...category,
    fill: COLORS[index % COLORS.length],
  }))

  const inventoryData = Object.entries(inventoryStatus).map(([status, count], index) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, ' $1'),
    value: count,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.activeProducts} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Units Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.totalUnitsSold.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.averagePrice)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per product
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Category Performance</span>
            </CardTitle>
            <Select value={selectedPeriod} onValueChange={(value: "year" | "week" | "day" | "month") => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Bar 
                dataKey="revenue" 
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Inventory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Stock</span>
                <span className="font-medium text-green-600">{inventoryStatus.inStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low Stock</span>
                <span className="font-medium text-yellow-600">{inventoryStatus.lowStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Out of Stock</span>
                <span className="font-medium text-red-600">{inventoryStatus.outOfStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inactive</span>
                <span className="font-medium text-gray-600">{inventoryStatus.inactive}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.byRevenue.slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium truncate max-w-24">{product.name}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(product.totalRevenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top by Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.byQuantity.slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium truncate max-w-24">{product.name}</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {product.totalSold}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Rated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.byRating.slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium truncate max-w-24">{product.name}</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">
                    ⭐ {product.averageRating.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Low Stock Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.productId} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <span className="text-sm font-medium text-orange-600">
                    {product.stock} left
                  </span>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <p className="text-sm text-orange-600 text-center">
                  +{lowStockProducts.length - 5} more products need restocking
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProductChart
