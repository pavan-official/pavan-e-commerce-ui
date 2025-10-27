import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const SalesChart = () => {
  const {
    salesAnalytics,
    isLoading,
    error,
    fetchSalesAnalytics,
    selectedPeriod,
    setPeriod,
  } = useAnalyticsStore()

  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line')
  const [dataType, setDataType] = useState<'revenue' | 'orders'>('revenue')

  useEffect(() => {
    fetchSalesAnalytics()
  }, [fetchSalesAnalytics])

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
          <p className="text-red-600 mb-2">Error loading sales data</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchSalesAnalytics()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!salesAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No sales data available</p>
      </div>
    )
  }

  const { chartData, summary, topProducts } = salesAnalytics

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const salesData = chartData.salesByPeriod.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
  }))

  const categoryData = chartData.salesByCategory.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }))

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={dataType === 'revenue' ? formatCurrency : undefined}
              />
              <Tooltip 
                formatter={(value: number) => [
                  dataType === 'revenue' ? formatCurrency(value) : value,
                  dataType === 'revenue' ? 'Revenue' : 'Orders'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey={dataType === 'revenue' ? 'revenue' : 'orders'} 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={dataType === 'revenue' ? formatCurrency : undefined}
              />
              <Tooltip 
                formatter={(value: number) => [
                  dataType === 'revenue' ? formatCurrency(value) : value,
                  dataType === 'revenue' ? 'Revenue' : 'Orders'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar 
                dataKey={dataType === 'revenue' ? 'revenue' : 'orders'} 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="revenue"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {summary.totalOrders} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.averageOrderValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per order
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-gray-900">
              {new Date(summary.period.from).toLocaleDateString()} - {new Date(summary.period.to).toLocaleDateString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Analysis period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Sales Analytics</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
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
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setChartType('line')}
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setChartType('pie')}
                >
                  <PieChartIcon className="h-4 w-4" />
                </Button>
              </div>

              {chartType !== 'pie' && (
                <Select value={dataType} onValueChange={(value: "revenue" | "orders") => setDataType(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(product.revenue)}</p>
                  <p className="text-sm text-gray-500">{product.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SalesChart
