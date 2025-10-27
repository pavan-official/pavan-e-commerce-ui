import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { Users } from 'lucide-react'
import { useEffect } from 'react'
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const UserChart = () => {
  const {
    userAnalytics,
    isLoading,
    error,
    fetchUserAnalytics,
    selectedPeriod,
    setPeriod,
  } = useAnalyticsStore()

  useEffect(() => {
    fetchUserAnalytics()
  }, [fetchUserAnalytics])

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
          <p className="text-red-600 mb-2">Error loading user data</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchUserAnalytics()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!userAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No user data available</p>
      </div>
    )
  }

  const { chartData, summary, metrics, topCustomers } = userAnalytics

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const registrationData = chartData.registrationsByDay.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
  }))

  const roleData = Object.entries(chartData.roleDistribution).map(([role, count], index) => ({
    name: role,
    value: count,
    fill: COLORS[index % COLORS.length],
  }))

  const engagementData = Object.entries(chartData.engagementLevels).map(([level, count], index) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
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
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All-time users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.newUsers.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Retention Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.retentionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              User retention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Registration Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Registrations</span>
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
            <LineChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [value, 'New Users']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Orders per User</span>
                <span className="font-medium">{metrics.averageOrdersPerUser.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Reviews per User</span>
                <span className="font-medium">{metrics.averageReviewsPerUser.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Users with Orders</span>
                <span className="font-medium">{metrics.usersWithOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Users with Reviews</span>
                <span className="font-medium">{metrics.usersWithReviews}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.userId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">Customer #{customer.userId.slice(-8)}</p>
                    <p className="text-sm text-gray-500">{customer.orderCount} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${customer.totalSpent.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">${customer.averageOrderValue.toFixed(2)} avg</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserChart
