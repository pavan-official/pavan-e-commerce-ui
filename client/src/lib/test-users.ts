// 🧪 **Test Users for Development and Kubernetes**
// Purpose: Provide consistent test users for development and testing

import bcrypt from 'bcryptjs'

export interface TestUser {
  email: string
  password: string
  name: string
  role: 'USER' | 'ADMIN'
}

export const TEST_USERS: TestUser[] = [
  {
    email: 'customer@example.com',
    password: 'password123',
    name: 'Test Customer',
    role: 'USER'
  },
  {
    email: 'admin@example.com', 
    password: 'admin123',
    name: 'Test Admin',
    role: 'ADMIN'
  },
  {
    email: 'user@test.com',
    password: 'test123',
    name: 'Regular User',
    role: 'USER'
  }
]

// Function to create test users in database
export async function createTestUsers() {
  const { prisma } = await import('@/lib/prisma')
  
  for (const user of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      })
      
      if (existingUser) {
        console.log(`✅ Test user ${user.email} already exists`)
        continue
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 12)
      
      // Create user
      await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          name: user.name,
          role: user.role,
          emailVerified: new Date(),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
        }
      })
      
      console.log(`✅ Created test user: ${user.email} (${user.role})`)
    } catch (error) {
      console.error(`❌ Failed to create test user ${user.email}:`, error)
    }
  }
}

// Function to get test user credentials
export function getTestUser(role: 'USER' | 'ADMIN' = 'USER'): TestUser {
  const user = TEST_USERS.find(u => u.role === role)
  if (!user) {
    throw new Error(`No test user found for role: ${role}`)
  }
  return user
}

// Function to get all test users
export function getAllTestUsers(): TestUser[] {
  return TEST_USERS
}

