import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Admin',
  description: 'Comprehensive analytics and reporting dashboard for administrators',
}

const AdminAnalyticsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <AnalyticsDashboard />
    </div>
  )
}

export default AdminAnalyticsPage
