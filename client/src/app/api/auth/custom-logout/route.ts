import { createLogoutResponse } from '@/lib/custom-auth'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    return createLogoutResponse()
  } catch (error) {
    console.error('Logout failed:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}