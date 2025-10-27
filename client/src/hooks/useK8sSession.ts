'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
  image?: string
}

interface Session {
  user: User
}

export function useK8sSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/k8s-session')
        const data = await response.json()
        
        if (data.user) {
          setSession(data)
        } else {
          setSession(null)
        }
      } catch (error) {
        console.error('Session fetch error:', error)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  const signOut = async () => {
    try {
      // Clear session cookie
      document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      setSession(null)
      window.location.href = '/auth/k8s-signin'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return {
    data: session,
    status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated',
    signOut,
  }
}
