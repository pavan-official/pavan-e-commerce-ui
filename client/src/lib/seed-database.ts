// 🌱 **Database Seeding Script**
// Purpose: Seed database with test users and sample data for development/testing

import { prisma } from './prisma'
import { createTestUsers } from './test-users'

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // 1. Create test users
    console.log('👥 Creating test users...')
    await createTestUsers()
    
    // 2. Create sample categories
    console.log('📂 Creating categories...')
    const categories = [
      { name: 'T-shirts', slug: 't-shirts', description: 'Comfortable cotton t-shirts' },
      { name: 'Shoes', slug: 'shoes', description: 'Stylish footwear for every occasion' },
      { name: 'Accessories', slug: 'accessories', description: 'Fashion accessories' },
      { name: 'Bags', slug: 'bags', description: 'Handbags and backpacks' },
      { name: 'Dresses', slug: 'dresses', description: 'Elegant dresses for all occasions' },
      { name: 'Jackets', slug: 'jackets', description: 'Warm and stylish jackets' },
      { name: 'Gloves', slug: 'gloves', description: 'Protective and fashionable gloves' }
    ]
    
    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category
      })
    }
    
    // 3. Create sample products
    console.log('🛍️ Creating sample products...')
    const products = [
      {
        name: 'Classic White T-Shirt',
        description: 'Comfortable cotton t-shirt in classic white',
        price: 29.99,
        quantity: 100,
        categorySlug: 't-shirts',
        images: ['/products/tshirt-white.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['white', 'black', 'gray']
      },
      {
        name: 'Running Sneakers',
        description: 'Lightweight running shoes for athletes',
        price: 89.99,
        quantity: 50,
        categorySlug: 'shoes',
        images: ['/products/sneakers.jpg'],
        sizes: ['7', '8', '9', '10', '11'],
        colors: ['white', 'black', 'blue']
      },
      {
        name: 'Leather Handbag',
        description: 'Elegant leather handbag for everyday use',
        price: 149.99,
        quantity: 25,
        categorySlug: 'bags',
        images: ['/products/handbag.jpg'],
        sizes: ['One Size'],
        colors: ['brown', 'black', 'tan']
      },
      {
        name: 'Summer Dress',
        description: 'Light and breezy summer dress',
        price: 79.99,
        quantity: 30,
        categorySlug: 'dresses',
        images: ['/products/dress.jpg'],
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['blue', 'pink', 'white']
      },
      {
        name: 'Winter Jacket',
        description: 'Warm winter jacket for cold weather',
        price: 199.99,
        quantity: 20,
        categorySlug: 'jackets',
        images: ['/products/jacket.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['black', 'navy', 'gray']
      }
    ]
    
    for (const product of products) {
      const category = await prisma.category.findUnique({
        where: { slug: product.categorySlug }
      })
      
      if (category) {
        await prisma.product.upsert({
          where: { id: `product-${product.name.toLowerCase().replace(/\s+/g, '-')}` },
          update: {},
          create: {
            id: `product-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: product.name,
            description: product.description,
            price: product.price,
            quantity: product.quantity,
            images: product.images,
            categoryId: category.id,
            slug: product.name.toLowerCase().replace(/\s+/g, '-'),
            sku: `SKU-${product.name.toUpperCase().replace(/\s+/g, '')}`
          }
        })
      }
    }
    
    console.log('✅ Database seeding completed successfully!')
    console.log('📋 Test users created:')
    console.log('   - customer@example.com (password: password123)')
    console.log('   - admin@example.com (password: admin123)')
    console.log('   - user@test.com (password: test123)')
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}
