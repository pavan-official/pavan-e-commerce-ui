// Simple script to update products using fetch
async function updateProducts() {
  try {
    console.log('🔄 Updating products with images...');
    
    const updates = [
      { id: 'prod_1', images: ['/products/1g.png'] },
      { id: 'prod_2', images: ['/products/2g.png'] },
      { id: 'prod_3', images: ['/products/3b.png'] },
      { id: 'prod_4', images: ['/products/1p.png'] },
      { id: 'prod_5', images: ['/products/2gr.png'] }
    ];
    
    for (const update of updates) {
      console.log(`✅ Would update ${update.id} with ${update.images[0]}`);
    }
    
    console.log('🎉 All products would be updated with images!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateProducts();
