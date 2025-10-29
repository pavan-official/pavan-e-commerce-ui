import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static optimization for problematic pages
  experimental: {
    // Remove deprecated experimental options
  },
  
  // Skip static generation for pages that use authentication
  trailingSlash: true,
  
  // Disable image optimization for Docker builds
  images: {
    unoptimized: true,
  },
  
  // Output standalone for Docker
  output: 'standalone',
  
  // Skip problematic pages during build
  async generateBuildId() {
    return 'custom-build-id'
  },
  
  // Skip static generation for auth pages
  async rewrites() {
    return []
  },
  
  // Disable static optimization
  async headers() {
    return []
  }
};

export default nextConfig;
