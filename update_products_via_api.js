// Simple script to update products using the existing API
const https = require('https');
const http = require('http');

async function updateProducts() {
  try {
    console.log('🔄 Updating products with images via API...');
    
    // First, let's test if the API is working
    const response = await fetch('http://localhost:3000/api/products');
    const data = await response.json();
    
    console.log('✅ API is working, found products:', data.data.length);
    console.log('✅ First product images:', data.data[0].images);
    
    console.log('🎉 Products API is accessible!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateProducts();
