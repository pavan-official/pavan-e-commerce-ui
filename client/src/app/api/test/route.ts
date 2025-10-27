// 🧪 **Test API Endpoint**
// Purpose: Test authentication and cart functionality

import { runComprehensiveTest } from '@/lib/test-authentication'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    console.log('🧪 Running comprehensive test...')
    
    const results = await runComprehensiveTest()
    
    return NextResponse.json({
      success: true,
      message: 'Comprehensive test completed',
      results: {
        authentication: results.authentication,
        cart: results.cart,
        errors: results.errors,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEST_FAILED',
          message: 'Comprehensive test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType } = body
    
    let results: any = {}
    
    switch (testType) {
      case 'authentication':
        const { testAuthentication } = await import('@/lib/test-authentication')
        const credentials = { email: 'customer@example.com', password: 'password123', role: 'USER' as const }
        results = await testAuthentication(credentials)
        break
        
      case 'cart':
        const { testCartAdd, testCartGet } = await import('@/lib/test-authentication')
        const addResult = await testCartAdd('1', 1)
        const getResult = await testCartGet()
        results = { add: addResult, get: getResult }
        break
        
      case 'session':
        const { testSession } = await import('@/lib/test-authentication')
        results = await testSession()
        break
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_TEST_TYPE',
              message: 'Invalid test type. Use: authentication, cart, or session'
            }
          },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      message: `${testType} test completed`,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEST_FAILED',
          message: 'Test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
      },
      { status: 500 }
    )
  }
}

