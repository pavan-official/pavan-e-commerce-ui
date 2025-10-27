// 🌱 **Database Seeding API Endpoint**
// Purpose: Seed database with test data for development and testing

import { seedDatabase } from '@/lib/seed-database'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  try {
    // Only allow seeding in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEEDING !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Database seeding is not allowed in production',
          },
        },
        { status: 403 }
      )
    }

    console.log('🌱 Starting database seeding via API...')
    
    await seedDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        testUsers: [
          { email: 'customer@example.com', password: 'password123', role: 'USER' },
          { email: 'admin@example.com', password: 'admin123', role: 'ADMIN' },
          { email: 'user@test.com', password: 'test123', role: 'USER' }
        ]
      }
    })
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEEDING_FAILED',
          message: 'Failed to seed database',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
      },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Database seeding endpoint',
    usage: {
      method: 'POST',
      description: 'Seed database with test users and sample data',
      environment: process.env.NODE_ENV,
      allowed: process.env.NODE_ENV !== 'production' || process.env.ALLOW_SEEDING === 'true'
    }
  })
}

