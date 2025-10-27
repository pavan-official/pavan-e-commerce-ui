'use client'

import { useCustomAuth } from '@/hooks/useCustomAuth'
import { useState } from 'react'

export default function AuthDebug() {
  const { user, loading, error, retrySession } = useCustomAuth()
  const [testResult, setTestResult] = useState<any>(null)

  const testSessionEndpoint = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch('/api/auth/custom-session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      const data = await response.json()
      setTestResult({
        status: response.status,
        ok: response.ok,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      setTestResult({
        error: err instanceof Error ? err.message : 'Unknown error',
        errorType: err instanceof Error ? err.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      })
    }
  }

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/custom-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'customer@example.com',
          password: 'password123'
        }),
      })
      
      const data = await response.json()
      setTestResult({
        status: response.status,
        ok: response.ok,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      setTestResult({
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">🔧 Auth Debug</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>User:</strong> {user ? `${user.name} (${user.email})` : 'Not logged in'}
        </div>
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {error || 'None'}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={testSessionEndpoint}
          className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Test Session Endpoint
        </button>
        
        <button
          onClick={testLogin}
          className="w-full bg-green-500 text-white px-2 py-1 rounded text-xs"
        >
          Test Login
        </button>
        
        <button
          onClick={retrySession}
          className="w-full bg-yellow-500 text-white px-2 py-1 rounded text-xs"
        >
          Retry Session Check
        </button>
      </div>

      {testResult && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
          <strong>Test Result:</strong>
          <pre className="whitespace-pre-wrap overflow-auto max-h-32">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
