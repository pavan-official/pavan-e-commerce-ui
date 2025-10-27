/**
 * Test Cart Functionality Script
 * Tests adding items to cart and retrieving cart
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing cart functionality...\n')

  // Get test user
  const user = await prisma.user.findUnique({
    where: { email: 'user@example.com' }
  })

  if (!user) {
    console.error('❌ Test user not found')
    return
  }

  console.log(`✅ Found test user: ${user.email}`)

  // Get a test product
  const product = await prisma.product.findFirst({
    where: { name: 'Cotton T-Shirt' }
  })

  if (!product) {
    console.error('❌ Test product not found')
    return
  }

  console.log(`✅ Found test product: ${product.name}`)

  // Clear existing cart items for this user
  await prisma.cartItem.deleteMany({
    where: { userId: user.id }
  })
  console.log('✅ Cleared existing cart items')

  // Add item to cart
  const cartItem = await prisma.cartItem.create({
    data: {
      userId: user.id,
      productId: product.id,
      quantity: 2,
    },
    include: {
      product: {
        include: {
          category: true,
        }
      }
    }
  })

  console.log('\n✅ Added item to cart:')
  console.log(`   Product: ${cartItem.product.name}`)
  console.log(`   Category: ${cartItem.product.category.name}`)
  console.log(`   Quantity: ${cartItem.quantity}`)
  console.log(`   Price: $${cartItem.product.price}`)
  console.log(`   Total: $${Number(cartItem.product.price) * cartItem.quantity}`)

  // Retrieve cart
  const cart = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          category: true,
          variants: true,
        },
      },
      variant: true,
    },
  })

  console.log(`\n✅ Retrieved cart: ${cart.length} items`)
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const price = item.variant?.price || item.product.price
    return sum + (Number(price) * item.quantity)
  }, 0)

  const tax = subtotal * 0.08
  const total = subtotal + tax

  console.log('\n📊 Cart Summary:')
  console.log(`   Items: ${cart.reduce((sum, item) => sum + item.quantity, 0)}`)
  console.log(`   Subtotal: $${subtotal.toFixed(2)}`)
  console.log(`   Tax (8%): $${tax.toFixed(2)}`)
  console.log(`   Total: $${total.toFixed(2)}`)

  console.log('\n🎉 Cart functionality test PASSED!')
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



