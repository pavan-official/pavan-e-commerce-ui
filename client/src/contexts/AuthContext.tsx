'use client'

import { CustomUser } from '@/types/auth'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface AuthState {
  user: CustomUser | null
  loading: boolean
  error: string | null
  isInitialized: boolean
  lastChecked: number
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
  retryAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Enterprise-grade authentication provider with bulletproof state management
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isInitialized: false,
    lastChecked: 0,
  })

  // Prevent multiple simultaneous auth checks
  const authCheckInProgress = useRef(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3
  const retryDelay = 1000 // 1 second

  // Centralized state update function with validation
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates }
      
      // Log state changes for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Auth State Update:', {
          user: newState.user ? `${newState.user.name} (${newState.user.email})` : 'null',
          loading: newState.loading,
          error: newState.error,
          isInitialized: newState.isInitialized,
          timestamp: new Date().toISOString()
        })
      }
      
      return newState
    })
  }, [])

  // Bulletproof session check with exponential backoff
  const checkSession = useCallback(async (retryCount = 0): Promise<void> => {
    // Prevent concurrent session checks
    if (authCheckInProgress.current) {
      console.log('🔐 Session check already in progress, skipping...')
      return
    }

    authCheckInProgress.current = true

    try {
      updateState({ loading: true, error: null })

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, jitter))

      const response = await fetch('/api/auth/custom-session/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.user) {
          updateState({
            user: data.user,
            loading: false,
            error: null,
            isInitialized: true,
            lastChecked: Date.now(),
          })
        } else {
          updateState({
            user: null,
            loading: false,
            error: null,
            isInitialized: true,
            lastChecked: Date.now(),
          })
        }
      } else {
        throw new Error(`Session check failed: ${response.status}`)
      }
    } catch (error) {
      console.error('🔐 Session check error:', error)
      
      if (retryCount < maxRetries) {
        const delay = retryDelay * Math.pow(2, retryCount) // Exponential backoff
        console.log(`🔐 Retrying session check in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)
        
        retryTimeoutRef.current = setTimeout(() => {
          checkSession(retryCount + 1)
        }, delay)
      } else {
        updateState({
          user: null,
          loading: false,
          error: 'Unable to verify session. Please refresh the page.',
          isInitialized: true,
          lastChecked: Date.now(),
        })
      }
    } finally {
      authCheckInProgress.current = false
    }
  }, [updateState])

  // Login with comprehensive error handling
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      updateState({ loading: true, error: null })

      const response = await fetch('/api/auth/custom-login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const data = await response.json()

      if (data.success && data.user) {
        updateState({
          user: data.user,
          loading: false,
          error: null,
          isInitialized: true,
          lastChecked: Date.now(),
        })
        return true
      } else {
        updateState({
          loading: false,
          error: data.error || 'Login failed. Please check your credentials.',
        })
        return false
      }
    } catch (error) {
      console.error('🔐 Login error:', error)
      updateState({
        loading: false,
        error: 'Network error. Please check your connection and try again.',
      })
      return false
    }
  }, [updateState])

  // Logout with cleanup
  const logout = useCallback(async (): Promise<void> => {
    try {
      updateState({ loading: true })

      await fetch('/api/auth/custom-logout/', {
        method: 'POST',
        credentials: 'include',
        signal: AbortSignal.timeout(5000),
      })

      updateState({
        user: null,
        loading: false,
        error: null,
        isInitialized: true,
        lastChecked: Date.now(),
      })
    } catch (error) {
      console.error('🔐 Logout error:', error)
      // Even if logout fails, clear local state
      updateState({
        user: null,
        loading: false,
        error: null,
        isInitialized: true,
        lastChecked: Date.now(),
      })
    }
  }, [updateState])

  // Manual session refresh
  const refreshSession = useCallback(async (): Promise<void> => {
    await checkSession(0)
  }, [checkSession])

  // Clear error state
  const clearError = useCallback(() => {
    updateState({ error: null })
  }, [updateState])

  // Retry authentication with fresh session check
  const retryAuth = useCallback(async (): Promise<void> => {
    updateState({ error: null })
    await checkSession(0)
  }, [checkSession])

  // Initialize authentication on mount
  useEffect(() => {
    checkSession(0)

    // Cleanup timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [checkSession])

  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.user && state.isInitialized) {
        const timeSinceLastCheck = Date.now() - state.lastChecked
        if (timeSinceLastCheck > 5 * 60 * 1000) { // 5 minutes
          console.log('🔐 Periodic session validation...')
          checkSession(0)
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [state.user, state.isInitialized, state.lastChecked, checkSession])

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshSession,
    clearError,
    retryAuth,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook with error boundary
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Higher-order component for authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean; fallback?: React.ComponentType } = {}
) {
  const { requireAuth = false, fallback: FallbackComponent } = options

  return function AuthenticatedComponent(props: P) {
    const { user, loading, error, isInitialized } = useAuth()

    // Show loading state
    if (loading || !isInitialized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    // Show error state
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    // Require authentication
    if (requireAuth && !user) {
      if (FallbackComponent) {
        return <FallbackComponent />
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
            <a
              href="/auth/signin/"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign In
            </a>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
