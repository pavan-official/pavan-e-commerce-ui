'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

// Force dynamic rendering for debug pages
export const dynamic = 'force-dynamic'

export default function AuthDebug() {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: 'loading' }
  const [apiTest, setApiTest] = useState<any>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('/api/cart')
        const data = await response.json()
        setApiTest(data)
      } catch (error) {
        setApiTest({ error: error instanceof Error ? error.message : String(error) })
      }
    }
    testAPI()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Session:</strong> {JSON.stringify(session, null, 2)}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">API Test</h2>
          <p><strong>Cart API Response:</strong> {JSON.stringify(apiTest, null, 2)}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Environment</h2>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
          <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL}</p>
          <p><strong>NEXTAUTH_SECRET:</strong> {process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set'}</p>
        </div>
      </div>
    </div>
  )
}



