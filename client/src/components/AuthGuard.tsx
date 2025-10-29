'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = false, 
  redirectTo = '/auth/signin/',
  fallback 
}: AuthGuardProps) {
  const { user, loading, error, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're initialized and not loading
    if (isInitialized && !loading && requireAuth && !user) {
      console.log('🔐 AuthGuard: Redirecting to sign-in page')
      router.push(redirectTo)
    }
  }, [user, loading, isInitialized, requireAuth, redirectTo, router])

  // Show loading state
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Authentication Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                // Clear auth data and redirect
                document.cookie.split(";").forEach((c) => {
                  const eqPos = c.indexOf("=")
                  const name = eqPos > -1 ? c.substr(0, eqPos) : c
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
                })
                router.push('/auth/signin/')
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear & Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to access this page.
          </p>
          <button
            onClick={() => router.push('/auth/signin/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Convenience components for common use cases
export function RequireAuth({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function OptionalAuth({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      {children}
    </AuthGuard>
  )
}
