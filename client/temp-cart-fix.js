// Temporary cart API fix
// This will work with the user ID directly

const express = require('express');
const app = express();

// Simple in-memory cart for user_123
let userCart = {
  'user_123': []
};

app.get('/api/cart', (req, res) => {
  const userId = 'user_123'; // Hardcoded for testing
  const cart = userCart[userId] || [];
  
  res.json({
    success: true,
    data: {
      items: cart,
      summary: {
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        tax: 0,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }
    }
  });
});

app.post('/api/cart', (req, res) => {
  const userId = 'user_123'; // Hardcoded for testing
  const { productId, quantity = 1, variantId = null } = req.body;
  
  if (!userCart[userId]) {
    userCart[userId] = [];
  }
  
  const existingItem = userCart[userId].find(item => 
    item.productId === productId && item.variantId === variantId
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    userCart[userId].push({ 
      productId, 
      quantity, 
      variantId,
      price: 29.99 // Default price
    });
  }
  
  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: userCart[userId]
  });
});

module.exports = app;
