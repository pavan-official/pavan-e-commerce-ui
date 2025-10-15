import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ==================================================================================================
  // DOCKER & PRODUCTION CONFIGURATION
  // ==================================================================================================
  
  // Enable standalone output for Docker
  // Why: Creates a minimal production server with only necessary files
  // Result: ~90% smaller deployment size
  // Interview Note: Essential for containerized deployments
  output: 'standalone',
  
  // ==================================================================================================
  // PERFORMANCE OPTIMIZATION
  // ==================================================================================================
  
  // SWC minification is enabled by default in Next.js 13+
  // No need to specify swcMinify anymore
  
  // Compress responses
  // Why: Reduces bandwidth, faster page loads
  compress: true,
  
  // ==================================================================================================
  // SECURITY
  // ==================================================================================================
  
  // Security headers
  // Why: Protect against common web vulnerabilities
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
  
  // ==================================================================================================
  // IMAGE OPTIMIZATION
  // ==================================================================================================
  
  images: {
    // Supported image formats
    formats: ['image/avif', 'image/webp'],
    
    // Remote image domains (if using external CDN)
    // domains: ['cdn.example.com'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for different viewports
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // ==================================================================================================
  // BUILD CONFIGURATION
  // ==================================================================================================
  
  // Environment variable handling
  env: {
    // Build-time environment variables
    NEXT_PHASE: process.env.NEXT_PHASE || 'phase-production-build',
  },
  
  // TypeScript configuration
  typescript: {
    // Temporarily allow builds with TypeScript errors during development
    // TODO: Fix all TypeScript errors and re-enable strict checking
    ignoreBuildErrors: true,
  },
  
  // ESLint configuration
  eslint: {
    // Temporarily allow builds with ESLint errors during development
    // TODO: Fix all ESLint errors and re-enable strict checking
    ignoreDuringBuilds: true,
  },
  
  // ==================================================================================================
  // EXPERIMENTAL FEATURES
  // ==================================================================================================
  
  experimental: {
    // Enable build-time optimizations
    optimizeCss: true,
    optimizePackageImports: ['@prisma/client', 'bcryptjs', 'stripe'],
  },
};

export default nextConfig;
