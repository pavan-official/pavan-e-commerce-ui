import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Try primary session cookie first
    let sessionToken = request.cookies.get('next-auth.session-token')?.value
    
    // Fallback to backup session cookie for browser compatibility
    if (!sessionToken) {
      sessionToken = request.cookies.get('session-backup')?.value
    }

    if (!sessionToken) {
      console.log('🔍 No session token found in cookies')
      return NextResponse.json({})
    }

    try {
      // Parse session data
      const sessionData = JSON.parse(sessionToken)
      
      if (sessionData && sessionData.user) {
        console.log('✅ Session found for user:', sessionData.user.email)
        return NextResponse.json({
          user: sessionData.user,
        })
      }
    } catch (parseError) {
      console.error('❌ Session parse error:', parseError)
    }

    console.log('❌ Invalid session data')
    return NextResponse.json({})
  } catch (error) {
    console.error('🚨 Session error:', error)
    return NextResponse.json({})
  }
}
