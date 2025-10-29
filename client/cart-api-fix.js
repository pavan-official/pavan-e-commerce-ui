// Modified cart API that works with guest users
// This is a temporary fix for the cart functionality

// For now, let's create a simple solution:
// 1. Allow cart operations without authentication
// 2. Use a guest session ID for cart operations

const GUEST_SESSION_ID = 'guest_session_' + Date.now();

// Simple cart storage in memory (in production, use Redis or database)
const guestCarts = {};

// Cart API functions
const cartAPI = {
  getCart: (sessionId = GUEST_SESSION_ID) => {
    return guestCarts[sessionId] || [];
  },
  
  addToCart: (sessionId = GUEST_SESSION_ID, productId, quantity = 1, variantId = null) => {
    if (!guestCarts[sessionId]) {
      guestCarts[sessionId] = [];
    }
    
    const existingItem = guestCarts[sessionId].find(item => 
      item.productId === productId && item.variantId === variantId
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      guestCarts[sessionId].push({ productId, quantity, variantId });
    }
    
    return guestCarts[sessionId];
  },
  
  removeFromCart: (sessionId = GUEST_SESSION_ID, productId, variantId = null) => {
    if (!guestCarts[sessionId]) return [];
    
    guestCarts[sessionId] = guestCarts[sessionId].filter(item => 
      !(item.productId === productId && item.variantId === variantId)
    );
    
    return guestCarts[sessionId];
  },
  
  updateQuantity: (sessionId = GUEST_SESSION_ID, productId, quantity, variantId = null) => {
    if (!guestCarts[sessionId]) return [];
    
    const item = guestCarts[sessionId].find(item => 
      item.productId === productId && item.variantId === variantId
    );
    
    if (item) {
      if (quantity <= 0) {
        return cartAPI.removeFromCart(sessionId, productId, variantId);
      } else {
        item.quantity = quantity;
      }
    }
    
    return guestCarts[sessionId];
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = cartAPI;
} else {
  window.cartAPI = cartAPI;
}
