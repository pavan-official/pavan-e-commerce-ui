// 🧪 **Authentication Testing Utilities**
// Purpose: Test authentication functionality in development and Kubernetes

export interface TestCredentials {
  email: string
  password: string
  role: 'USER' | 'ADMIN'
}

export const TEST_CREDENTIALS: TestCredentials[] = [
  {
    email: 'customer@example.com',
    password: 'password123',
    role: 'USER'
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  {
    email: 'user@test.com',
    password: 'test123',
    role: 'USER'
  }
]

// Function to test authentication
export async function testAuthentication(credentials: TestCredentials): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    const response = await fetch('/api/auth/custom-login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (data.success) {
      return {
        success: true,
        user: data.user
      }
    } else {
      return {
        success: false,
        error: data.error || 'Login failed'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

// Function to test session validation
export async function testSession(): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    const response = await fetch('/api/auth/custom-session/', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (data.user) {
      return {
        success: true,
        user: data.user
      }
    } else {
      return {
        success: false,
        error: 'No user in session'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

// Function to test cart functionality
export async function testCartAdd(productId: string, quantity: number = 1): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch('/api/cart/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        productId,
        quantity,
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (data.success) {
      return {
        success: true
      }
    } else {
      return {
        success: false,
        error: data.error?.message || 'Failed to add to cart'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

// Function to test cart retrieval
export async function testCartGet(): Promise<{
  success: boolean
  items?: any[]
  error?: string
}> {
  try {
    const response = await fetch('/api/cart/', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    
    if (data.success) {
      return {
        success: true,
        items: data.data?.items || []
      }
    } else {
      return {
        success: false,
        error: data.error?.message || 'Failed to get cart'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

// Comprehensive test function
export async function runComprehensiveTest(): Promise<{
  authentication: boolean
  cart: boolean
  errors: string[]
}> {
  const errors: string[] = []
  let authentication = false
  let cart = false

  console.log('🧪 Running comprehensive authentication and cart test...')

  // Test 1: Authentication
  console.log('1. Testing authentication...')
  const authResult = await testAuthentication(TEST_CREDENTIALS[0])
  if (authResult.success) {
    console.log('✅ Authentication successful')
    authentication = true
  } else {
    console.log('❌ Authentication failed:', authResult.error)
    errors.push(`Authentication: ${authResult.error}`)
  }

  // Test 2: Session validation
  if (authentication) {
    console.log('2. Testing session validation...')
    const sessionResult = await testSession()
    if (sessionResult.success) {
      console.log('✅ Session validation successful')
    } else {
      console.log('❌ Session validation failed:', sessionResult.error)
      errors.push(`Session: ${sessionResult.error}`)
    }
  }

  // Test 3: Cart functionality
  if (authentication) {
    console.log('3. Testing cart functionality...')
    
    // Test adding to cart (using a sample product ID)
    const cartAddResult = await testCartAdd('1', 1)
    if (cartAddResult.success) {
      console.log('✅ Add to cart successful')
      
      // Test getting cart
      const cartGetResult = await testCartGet()
      if (cartGetResult.success) {
        console.log('✅ Get cart successful')
        cart = true
      } else {
        console.log('❌ Get cart failed:', cartGetResult.error)
        errors.push(`Get cart: ${cartGetResult.error}`)
      }
    } else {
      console.log('❌ Add to cart failed:', cartAddResult.error)
      errors.push(`Add to cart: ${cartAddResult.error}`)
    }
  }

  console.log('🧪 Test completed')
  return { authentication, cart, errors }
}
