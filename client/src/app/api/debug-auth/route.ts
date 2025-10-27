// 🔧 **Authentication Debug API**
// Purpose: Debug authentication issues in development

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const testType = url.searchParams.get('test') || 'session'
    
    let result: any = {
      timestamp: new Date().toISOString(),
      testType,
      success: false
    }
    
    switch (testType) {
      case 'session':
        try {
          const sessionResponse = await fetch(`${url.origin}/api/auth/custom-session`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || '',
            },
          })
          
          const sessionData = await sessionResponse.json()
          result = {
            ...result,
            success: true,
            session: {
              status: sessionResponse.status,
              ok: sessionResponse.ok,
              data: sessionData
            }
          }
        } catch (error) {
          result.error = error instanceof Error ? error.message : 'Unknown error'
        }
        break
        
      case 'login':
        try {
          const loginResponse = await fetch(`${url.origin}/api/auth/custom-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'customer@example.com',
              password: 'password123'
            }),
          })
          
          const loginData = await loginResponse.json()
          result = {
            ...result,
            success: true,
            login: {
              status: loginResponse.status,
              ok: loginResponse.ok,
              data: loginData
            }
          }
        } catch (error) {
          result.error = error instanceof Error ? error.message : 'Unknown error'
        }
        break
        
      case 'health':
        result = {
          ...result,
          success: true,
          health: {
            server: 'running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
          }
        }
        break
        
      default:
        result.error = 'Invalid test type. Use: session, login, or health'
    }
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

