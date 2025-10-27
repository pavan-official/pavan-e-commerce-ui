import { getTokenFromRequest, verifyJWTToken } from '@/lib/custom-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json({ user: null })
    }

    const user = verifyJWTToken(token)
    
    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session check failed:', error)
    return NextResponse.json({ user: null })
  }
}