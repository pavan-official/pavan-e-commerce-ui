// import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import { Metadata } from 'next'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Admin',
  description: 'Comprehensive analytics and reporting dashboard for administrators',
}

const AdminAnalyticsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
        <p className="text-gray-600">Analytics dashboard is being prepared. Coming soon!</p>
      </div>
    </div>
  )
}

export default AdminAnalyticsPage
