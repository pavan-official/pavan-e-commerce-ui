// Simple guest cart implementation
// This will store cart items in localStorage for guest users

// Check if user is authenticated
const isAuthenticated = async () => {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return session && session.user && session.user.id;
  } catch (error) {
    return false;
  }
};

// Guest cart functions
const guestCart = {
  getItems: () => {
    const cart = localStorage.getItem('guest-cart');
    return cart ? JSON.parse(cart) : [];
  },
  
  addItem: (productId, quantity = 1) => {
    const items = guestCart.getItems();
    const existingItem = items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.push({ productId, quantity, variantId: null });
    }
    
    localStorage.setItem('guest-cart', JSON.stringify(items));
    return items;
  },
  
  removeItem: (productId) => {
    const items = guestCart.getItems().filter(item => item.productId !== productId);
    localStorage.setItem('guest-cart', JSON.stringify(items));
    return items;
  },
  
  updateQuantity: (productId, quantity) => {
    const items = guestCart.getItems();
    const item = items.find(item => item.productId === productId);
    
    if (item) {
      if (quantity <= 0) {
        return guestCart.removeItem(productId);
      } else {
        item.quantity = quantity;
      }
    }
    
    localStorage.setItem('guest-cart', JSON.stringify(items));
    return items;
  },
  
  clear: () => {
    localStorage.removeItem('guest-cart');
    return [];
  }
};

// Export for use in components
window.guestCart = guestCart;
