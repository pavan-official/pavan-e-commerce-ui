# Cart Error Fix - Simple Solution

## Problem
The cart API requires authentication, but users are not logged in, causing "An error occurred while adding item to cart" error.

## Quick Fix
Add this JavaScript code to your frontend to implement guest cart functionality:

```javascript
// Guest Cart Implementation
class GuestCart {
  constructor() {
    this.storageKey = 'guest-cart';
  }
  
  getItems() {
    const cart = localStorage.getItem(this.storageKey);
    return cart ? JSON.parse(cart) : [];
  }
  
  addItem(productId, quantity = 1, variantId = null) {
    const items = this.getItems();
    const existingItem = items.find(item => 
      item.productId === productId && item.variantId === variantId
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.push({ productId, quantity, variantId });
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.updateCartUI();
    return items;
  }
  
  removeItem(productId, variantId = null) {
    const items = this.getItems().filter(item => 
      !(item.productId === productId && item.variantId === variantId)
    );
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.updateCartUI();
    return items;
  }
  
  updateQuantity(productId, quantity, variantId = null) {
    const items = this.getItems();
    const item = items.find(item => 
      item.productId === productId && item.variantId === variantId
    );
    
    if (item) {
      if (quantity <= 0) {
        return this.removeItem(productId, variantId);
      } else {
        item.quantity = quantity;
      }
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.updateCartUI();
    return items;
  }
  
  clear() {
    localStorage.removeItem(this.storageKey);
    this.updateCartUI();
    return [];
  }
  
  updateCartUI() {
    const items = this.getItems();
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update cart count in UI
    const cartCountElement = document.querySelector('[data-cart-count]');
    if (cartCountElement) {
      cartCountElement.textContent = itemCount;
    }
    
    // Update cart title
    const cartTitleElement = document.querySelector('[data-cart-title]');
    if (cartTitleElement) {
      cartTitleElement.textContent = `Shopping Cart (${itemCount})`;
    }
  }
}

// Initialize guest cart
const guestCart = new GuestCart();

// Override the add to cart function
window.addToCart = function(productId, quantity = 1, variantId = null) {
  try {
    guestCart.addItem(productId, quantity, variantId);
    console.log('Item added to cart successfully');
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', () => {
  guestCart.updateCartUI();
});
```

## Usage
1. Add this script to your frontend
2. Replace cart API calls with `addToCart(productId, quantity)`
3. The cart will work with localStorage for guest users
4. Items will persist across page refreshes

## Benefits
- ✅ Works without authentication
- ✅ Persists across page refreshes
- ✅ Simple implementation
- ✅ No backend changes required
