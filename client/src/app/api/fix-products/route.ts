import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_request: NextRequest) {
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'All products fixed with images successfully!' 
    });
  } catch (error) {
    console.error('❌ Error fixing products:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fix products' 
    }, { status: 500 });
  }
}
