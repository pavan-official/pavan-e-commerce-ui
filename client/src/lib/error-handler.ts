import { NextResponse } from 'next/server'

export interface ApiError {
  code: string
  message: string
  details?: any
}

export class ApiErrorHandler {
  static notFound(resource: string, id?: string): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: `${resource.toUpperCase()}_NOT_FOUND`,
          message: `${resource} not found${id ? ` with ID: ${id}` : ''}`,
        },
      },
      { status: 404 }
    )
  }

  static unauthorized(message: string = 'Authentication required'): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message,
        },
      },
      { status: 401 }
    )
  }

  static forbidden(message: string = 'Access denied'): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message,
        },
      },
      { status: 403 }
    )
  }

  static validationError(details: any): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details,
        },
      },
      { status: 400 }
    )
  }

  static internalError(message: string = 'Internal server error'): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message,
        },
      },
      { status: 500 }
    )
  }

  static conflict(message: string): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message,
        },
      },
      { status: 409 }
    )
  }

  static tooManyRequests(message: string = 'Too many requests'): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message,
        },
      },
      { status: 429 }
    )
  }
}

// Utility function for consistent error logging
export function logError(error: Error, context?: string) {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` [${context}]` : ''
  
  console.error(`[${timestamp}]${contextStr} Error:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
  })
}

// Utility function for API route error handling
export function handleApiError(error: unknown, context?: string): NextResponse {
  logError(error instanceof Error ? error : new Error(String(error)), context)
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('not found')) {
      return ApiErrorHandler.notFound('resource')
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return ApiErrorHandler.unauthorized()
    }
    
    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return ApiErrorHandler.forbidden()
    }
  }
  
  // Default to internal server error
  return ApiErrorHandler.internalError()
}

