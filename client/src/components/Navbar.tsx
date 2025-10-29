"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { Heart, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdvancedSearchBar from "./AdvancedSearchBar";
import CartSidebar from "./CartSidebar";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const { summary, fetchCart } = useCartStore();
  const { items: wishlistItems, fetchWishlist } = useWishlistStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Debug logging
  console.log('Navbar - user:', user, 'loading:', loading);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchWishlist();
    }
  }, [user, fetchCart, fetchWishlist]);

  return (
    <>
      <nav className="w-full flex items-center justify-between border-b border-gray-200 pb-4">
        {/* LEFT */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="TrendLama"
            width={36}
            height={36}
            className="w-6 h-6 md:w-9 md:h-9"
          />
          <p className="hidden md:block text-md font-medium tracking-wider">
            TRENDLAMA.
          </p>
        </Link>
        
        {/* CENTER */}
        <div className="flex-1 max-w-lg mx-8">
          <AdvancedSearchBar />
        </div>
        
        {/* RIGHT */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <Home className="w-4 h-4 text-gray-600"/>
          </Link>
          
          {/* Wishlist */}
          <Link href="/wishlist" className="relative">
            <Heart className="w-4 h-4 text-gray-600"/>
            {wishlistItems.length > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
          </Link>
          
          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            {summary.itemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-blue-500 text-xs text-white flex items-center justify-center">
                {summary.itemCount}
              </span>
            )}
          </button>
          
          {/* Notifications */}
          {user && <NotificationBell />}
          
          {/* Auth */}
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Hello, {user.name}</span>
              <button
                onClick={() => logout()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
          )}
        </div>
      </nav>
      
      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;
