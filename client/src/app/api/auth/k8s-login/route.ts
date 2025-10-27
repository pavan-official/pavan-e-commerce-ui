import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    console.log('🔐 K8s Login attempt for:', email)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    console.log('👤 User found:', user ? 'YES' : 'NO')
    if (user) console.log('👤 User ID:', user.id, 'Has password:', !!user.password)

    if (!user || !user.password) {
      console.log('❌ Invalid credentials: User not found or no password')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('🔑 Password valid:', isPasswordValid)

    if (!isPasswordValid) {
      console.log('❌ Invalid credentials: Password mismatch')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    console.log('✅ Login successful for user:', user.email)

    // Create session data
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.avatar || user.image,
      },
    }

    // Set session cookie manually
    const response = NextResponse.json({
      success: true,
      data: sessionData,
    })

    // Set session cookie with production-ready configuration
    response.cookies.set('next-auth.session-token', JSON.stringify(sessionData), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production' && !process.env.KUBERNETES_SERVICE_HOST,
      domain: process.env.NODE_ENV === 'production' && !process.env.KUBERNETES_SERVICE_HOST ? undefined : undefined,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    // Also set a backup session cookie for browser compatibility
    response.cookies.set('session-backup', JSON.stringify(sessionData), {
      httpOnly: false, // Allow client-side access
      sameSite: 'lax',
      path: '/',
      secure: false,
      domain: undefined,
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('🚨 K8s Login error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed',
        },
      },
      { status: 500 }
    )
  }
}
