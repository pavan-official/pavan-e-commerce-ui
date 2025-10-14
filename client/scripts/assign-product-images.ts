/**
 * Assign Product Images Script
 * Assigns actual existing images to products
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Assigning product images...')

  // Get all products
  const products = await prisma.product.findMany({
    include: { category: true }
  })

  // Image assignments based on what actually exists
  const imageAssignments: Record<string, { thumbnail: string; images: string[] }> = {
    'Wireless Headphones': {
      thumbnail: '/products/1gr.png',
      images: ['/products/1gr.png', '/products/2gr.png'],
    },
    'Smart Watch': {
      thumbnail: '/products/3bl.png',
      images: ['/products/3bl.png', '/products/5bl.png'],
    },
    'Cotton T-Shirt': {
      thumbnail: '/products/5o.png',
      images: ['/products/5o.png', '/products/6g.png'],
    },
    'Garden Tools Set': {
      thumbnail: '/products/2gr.png',
      images: ['/products/2gr.png', '/products/3gr.png', '/products/8gr.png'],
    },
    'Nike Air Max 270': {
      thumbnail: '/products/7g.png',
      images: ['/products/7g.png', '/products/7p.png'],
    },
    'Nike Ultraboost Pulse': {
      thumbnail: '/products/6w.png',
      images: ['/products/6w.png', '/products/6g.png'],
    },
  }

  let updatedCount = 0

  for (const product of products) {
    const assignment = imageAssignments[product.name]
    
    if (assignment) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: assignment.images,
          thumbnail: assignment.thumbnail,
        },
      })
      console.log(`✅ Updated images for: ${product.name}`)
      console.log(`   Thumbnail: ${assignment.thumbnail}`)
      console.log(`   Images: ${assignment.images.join(', ')}`)
      updatedCount++
    } else {
      console.log(`⚠️  No image assignment for: ${product.name}`)
    }
  }

  console.log(`\n🎉 Updated ${updatedCount} products successfully!`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })



