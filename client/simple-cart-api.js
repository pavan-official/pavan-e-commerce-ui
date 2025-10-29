// Simple cart API for testing - bypasses authentication
import { NextResponse } from 'next/server';

// In-memory cart storage (for testing only)
let guestCarts = {};

export async function GET(request) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'guest_default';
    const cart = guestCarts[sessionId] || [];
    
    return NextResponse.json({
      success: true,
      data: {
        items: cart,
        summary: {
          itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: 0, // Calculate based on product prices
          tax: 0,
          total: 0
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch cart' }
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'guest_default';
    const { productId, quantity = 1, variantId = null } = await request.json();
    
    if (!productId) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Product ID is required' }
      }, { status: 400 });
    }
    
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
    
    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      data: guestCarts[sessionId]
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while adding item to cart' }
    }, { status: 500 });
  }
}
