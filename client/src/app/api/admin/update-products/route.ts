import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Updating products with images...');
    
    // Update each product with appropriate image
    await prisma.product.update({
      where: { id: 'prod_1' },
      data: { images: ['/products/1g.png'] }
    });
    console.log('✅ Updated prod_1 (T-shirt) with 1g.png');
    
    await prisma.product.update({
      where: { id: 'prod_2' },
      data: { images: ['/products/2g.png'] }
    });
    console.log('✅ Updated prod_2 (Jacket) with 2g.png');
    
    await prisma.product.update({
      where: { id: 'prod_3' },
      data: { images: ['/products/3b.png'] }
    });
    console.log('✅ Updated prod_3 (Shoes) with 3b.png');
    
    await prisma.product.update({
      where: { id: 'prod_4' },
      data: { images: ['/products/1p.png'] }
    });
    console.log('✅ Updated prod_4 (Dress) with 1p.png');
    
    await prisma.product.update({
      where: { id: 'prod_5' },
      data: { images: ['/products/2gr.png'] }
    });
    console.log('✅ Updated prod_5 (Bag) with 2gr.png');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All products updated with images successfully!' 
    });
  } catch (error) {
    console.error('❌ Error updating products:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update products' 
    }, { status: 500 });
  }
}
