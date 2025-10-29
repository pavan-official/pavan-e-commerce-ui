#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Step 1: Test login
    console.log('1. Testing login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/custom-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'customer@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData.success ? '✅ Success' : '❌ Failed');
    
    if (!loginData.success) {
      console.log('Login failed:', loginData);
      return;
    }

    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies received:', cookies ? '✅ Yes' : '❌ No');

    // Step 2: Test session check
    console.log('\n2. Testing session check...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/custom-session', {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    const sessionData = await sessionResponse.json();
    console.log('Session result:', sessionData.user ? '✅ Success' : '❌ Failed');
    
    if (sessionData.user) {
      console.log('User:', sessionData.user.email);
    }

    // Step 3: Test cart access
    console.log('\n3. Testing cart access...');
    const cartResponse = await fetch('http://localhost:3000/api/cart', {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    const cartData = await cartResponse.json();
    console.log('Cart result:', cartData.success ? '✅ Success' : '❌ Failed');
    
    if (cartData.success) {
      console.log('Cart items:', cartData.data.items.length);
    }

    // Step 4: Test adding to cart
    console.log('\n4. Testing add to cart...');
    const addToCartResponse = await fetch('http://localhost:3000/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        productId: 'product-summer-dress',
        quantity: 1
      })
    });
    
    const addToCartData = await addToCartResponse.json();
    console.log('Add to cart result:', addToCartData.success ? '✅ Success' : '❌ Failed');
    
    if (!addToCartData.success) {
      console.log('Add to cart error:', addToCartData.error);
    }

    console.log('\n🎉 Authentication flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthFlow();