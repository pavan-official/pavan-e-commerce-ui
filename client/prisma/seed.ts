import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      image: '/images/categories/electronics.jpg'
    }
  })

  const clothing = await prisma.category.create({
    data: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      image: '/images/categories/clothing.jpg'
    }
  })

  const home = await prisma.category.create({
    data: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      image: '/images/categories/home.jpg'
    }
  })

  console.log('✅ Categories created')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12)
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'John Doe',
      password: userPassword,
      role: 'USER',
      address: {
        create: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          isDefault: true
        }
      }
    }
  })

  console.log('✅ Users created')

  // Create products
  const products = [
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      shortDescription: 'Premium wireless headphones',
      price: 99.99,
      comparePrice: 129.99,
      sku: 'WH-001',
      categoryId: electronics.id,
      images: ['/images/products/headphones-1.jpg', '/images/products/headphones-2.jpg'],
      thumbnail: '/images/products/headphones-1.jpg',
      quantity: 50,
      isFeatured: true,
      weight: 0.5,
      length: 20,
      width: 15,
      height: 8
    },
    {
      name: 'Smart Watch',
      slug: 'smart-watch',
      description: 'Advanced smartwatch with health monitoring and GPS',
      shortDescription: 'Feature-rich smartwatch',
      price: 299.99,
      comparePrice: 399.99,
      sku: 'SW-001',
      categoryId: electronics.id,
      images: ['/images/products/smartwatch-1.jpg', '/images/products/smartwatch-2.jpg'],
      thumbnail: '/images/products/smartwatch-1.jpg',
      quantity: 25,
      isFeatured: true,
      weight: 0.3,
      length: 4,
      width: 4,
      height: 1
    },
    {
      name: 'Cotton T-Shirt',
      slug: 'cotton-t-shirt',
      description: 'Comfortable 100% cotton t-shirt in various colors',
      shortDescription: 'Soft cotton t-shirt',
      price: 19.99,
      sku: 'CT-001',
      categoryId: clothing.id,
      images: ['/images/products/tshirt-1.jpg', '/images/products/tshirt-2.jpg'],
      thumbnail: '/images/products/tshirt-1.jpg',
      quantity: 100,
      weight: 0.2,
      length: 30,
      width: 25,
      height: 1
    },
    {
      name: 'Garden Tools Set',
      slug: 'garden-tools-set',
      description: 'Complete set of professional garden tools',
      shortDescription: 'Professional garden tools',
      price: 79.99,
      comparePrice: 99.99,
      sku: 'GT-001',
      categoryId: home.id,
      images: ['/images/products/garden-tools-1.jpg', '/images/products/garden-tools-2.jpg'],
      thumbnail: '/images/products/garden-tools-1.jpg',
      quantity: 15,
      weight: 2.5,
      length: 50,
      width: 30,
      height: 10
    }
  ]

  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData
    })

    // Create product variants for some products
    if (product.slug === 'cotton-t-shirt') {
      await prisma.productVariant.createMany({
        data: [
          {
            productId: product.id,
            name: 'Size: Small, Color: Red',
            sku: 'CT-001-S-R',
            quantity: 25,
            attributes: { size: 'S', color: 'red' }
          },
          {
            productId: product.id,
            name: 'Size: Medium, Color: Red',
            sku: 'CT-001-M-R',
            quantity: 30,
            attributes: { size: 'M', color: 'red' }
          },
          {
            productId: product.id,
            name: 'Size: Large, Color: Blue',
            sku: 'CT-001-L-B',
            quantity: 25,
            attributes: { size: 'L', color: 'blue' }
          },
          {
            productId: product.id,
            name: 'Size: Large, Color: Green',
            sku: 'CT-001-L-G',
            quantity: 20,
            attributes: { size: 'L', color: 'green' }
          }
        ]
      })
    }

    // Create inventory record
    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: product.quantity,
        available: product.quantity,
        warehouse: 'main',
        location: 'A-1'
      }
    })
  }

  console.log('✅ Products created')

  // Create some reviews
  const wirelessHeadphones = await prisma.product.findFirst({
    where: { slug: 'wireless-headphones' }
  })

  if (wirelessHeadphones) {
    await prisma.review.createMany({
      data: [
        {
          userId: regularUser.id,
          productId: wirelessHeadphones.id,
          rating: 5,
          title: 'Excellent sound quality',
          content: 'These headphones have amazing sound quality and the noise cancellation works perfectly.',
          isVerified: true
        },
        {
          userId: adminUser.id,
          productId: wirelessHeadphones.id,
          rating: 4,
          title: 'Great value for money',
          content: 'Good build quality and comfortable to wear for long periods.',
          isVerified: true
        }
      ]
    })
  }

  console.log('✅ Reviews created')

  // Create some settings
  await prisma.setting.createMany({
    data: [
      {
        key: 'store_name',
        value: 'E-Commerce Store'
      },
      {
        key: 'store_email',
        value: 'info@example.com'
      },
      {
        key: 'tax_rate',
        value: 0.08
      },
      {
        key: 'shipping_rate',
        value: 9.99
      },
      {
        key: 'free_shipping_threshold',
        value: 50.00
      }
    ]
  })

  console.log('✅ Settings created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📋 Created:')
  console.log('- 3 categories')
  console.log('- 2 users (admin@example.com / user@example.com)')
  console.log('- 4 products with variants')
  console.log('- 2 reviews')
  console.log('- 5 settings')
  console.log('\n🔑 Login credentials:')
  console.log('Admin: admin@example.com / admin123')
  console.log('User: user@example.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
