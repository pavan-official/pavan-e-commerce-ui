// Simple script to fix products using the existing Prisma client
const { PrismaClient } = require('@prisma/client');

async function fixProducts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Fixing products with images...');
    
    // Update each product with appropriate image
    const updates = [
      { id: 'prod_1', images: ['/products/1g.png'] },
      { id: 'prod_2', images: ['/products/2g.png'] },
      { id: 'prod_3', images: ['/products/3b.png'] },
      { id: 'prod_4', images: ['/products/1p.png'] },
      { id: 'prod_5', images: ['/products/2gr.png'] }
    ];
    
    for (const update of updates) {
      await prisma.product.update({
        where: { id: update.id },
        data: { images: update.images }
      });
      console.log(`✅ Fixed ${update.id} with ${update.images[0]}`);
    }
    
    console.log('🎉 All products fixed with images successfully!');
  } catch (error) {
    console.error('❌ Error fixing products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProducts();
