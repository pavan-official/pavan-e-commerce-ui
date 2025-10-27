import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(__request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
        children: {
          where: { isActive: true },
          include: {
            _count: { select: { products: true } }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred'
        }
      },
      { status: 500 }
    )
  }
}
