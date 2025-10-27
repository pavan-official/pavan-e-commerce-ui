import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Map(Object.entries(init.headers || {}))
    }
  },
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      json: () => Promise.resolve(data),
      status: init.status || 200,
      headers: new Map(Object.entries(init.headers || {})),
    })),
  },
}))

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    wishlist: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}))

// Mock @auth/prisma-adapter
jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}))

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn(),
  }))
})

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password, saltRounds) => Promise.resolve(`hashed_${password}_${saltRounds}`)),
  compare: jest.fn((password, hash) => Promise.resolve(password === 'correct-password')),
}))

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  }))
})

// Mock missing UI components
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
}))

// Mock fetch
global.fetch = jest.fn()

// Mock Request and Response for Node.js environment
global.Request = class MockRequest {
  constructor(url, init = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
  }
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.headers = new Map(Object.entries(init.headers || {}))
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
}

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  jest.restoreAllMocks()
})