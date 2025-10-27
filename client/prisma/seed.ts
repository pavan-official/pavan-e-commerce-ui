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

  const shoes = await prisma.category.create({
    data: {
      name: 'Shoes',
      slug: 'shoes',
      description: 'Footwear and sneakers',
      image: '/images/categories/shoes.jpg'
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
      images: ['/products/1gr.png', '/products/2gr.png'],
      thumbnail: '/products/1gr.png',
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
      images: ['/products/3bl.png', '/products/5bl.png'],
      thumbnail: '/products/3bl.png',
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
      images: ['/products/5o.png', '/products/6g.png'],
      thumbnail: '/products/5o.png',
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
      images: ['/products/2gr.png', '/products/1gr.png'],
      thumbnail: '/products/2gr.png',
      quantity: 15,
      weight: 2.5,
      length: 50,
      width: 30,
      height: 10
    },
    {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      description: 'Comfortable running shoes with Air Max technology',
      shortDescription: 'Premium running shoes',
      price: 59.99,
      comparePrice: 79.99,
      sku: 'NAM-001',
      categoryId: shoes.id,
      images: ['/products/6g.png', '/products/6w.png'],
      thumbnail: '/products/6g.png',
      quantity: 30,
      isFeatured: true,
      weight: 0.8,
      length: 32,
      width: 12,
      height: 10
    },
    {
      name: 'Nike Ultraboost Pulse',
      slug: 'nike-ultraboost-pulse',
      description: 'High-performance running shoes with responsive cushioning',
      shortDescription: 'Performance running shoes',
      price: 69.99,
      comparePrice: 89.99,
      sku: 'NUP-001',
      categoryId: shoes.id,
      images: ['/products/7g.png', '/products/7p.png'],
      thumbnail: '/products/7g.png',
      quantity: 25,
      isFeatured: true,
      weight: 0.7,
      length: 31,
      width: 11,
      height: 9
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
