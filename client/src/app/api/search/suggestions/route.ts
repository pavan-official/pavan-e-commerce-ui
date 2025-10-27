import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const suggestionsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(10).default(5),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      q: searchParams.get('q') || '',
      limit: Number(searchParams.get('limit')) || 5,
    }

    const validation = suggestionsSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { q, limit } = validation.data

    // Get product suggestions
    const productSuggestions = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { shortDescription: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnail: true,
        price: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    })

    // Get category suggestions
    const categorySuggestions = await prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      take: Math.max(1, limit - productSuggestions.length),
      orderBy: {
        name: 'asc',
      },
    })

    // Get popular search terms (if we had a search history table)
    // For now, we'll return some common terms
    const popularTerms = [
      'electronics',
      'clothing',
      'accessories',
      'home',
      'garden',
      'sports',
      'books',
      'toys',
    ].filter(term => 
      term.toLowerCase().includes(q.toLowerCase()) && 
      term.toLowerCase() !== q.toLowerCase()
    ).slice(0, 2)

    const suggestions = {
      products: productSuggestions.map(product => ({
        type: 'product',
        id: product.id,
        title: product.name,
        subtitle: product.category.name,
        url: `/products/${product.slug}`,
        image: product.thumbnail,
        price: product.price,
      })),
      categories: categorySuggestions.map(category => ({
        type: 'category',
        id: category.id,
        title: category.name,
        subtitle: `${category._count.products} products`,
        url: `/products?category=${category.slug}`,
        count: category._count.products,
      })),
      terms: popularTerms.map(term => ({
        type: 'term',
        title: term,
        url: `/products?q=${encodeURIComponent(term)}`,
      })),
    }

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching suggestions',
        },
      },
      { status: 500 }
    )
  }
}
