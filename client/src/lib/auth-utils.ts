import { verifyJWTToken, getTokenFromRequest } from './custom-auth'
import { NextRequest } from 'next/server'

/**
 * Server-side authentication utility for API routes

 */
export async function getServerUser(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return null
    }

    const user = verifyJWTToken(token)
    return user
  } catch (error) {
    console.error('Auth verification failed:', error)
    return null
  }
}

/**
 * Client-side authentication utility

 */
export function useAuth() {
  // This will be implemented in the custom hook
  // For now, return a placeholder
  return {
    user: null,
    loading: true,
    error: null
  }
}
