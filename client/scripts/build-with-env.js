#!/usr/bin/env node

/**
 * Build Script with Environment Variables
 * QA-approved build script that sets required environment variables
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting build with environment variables...');

// Set build-time environment variables
const buildEnv = {
  // Encryption key for build (dummy value)
  ENCRYPTION_KEY: 'dummy-key-for-build-phase-only-not-for-production',
  
  // NextAuth configuration for build
  NEXTAUTH_SECRET: 'dummy-secret-for-build-phase-only',
  NEXTAUTH_URL: 'http://localhost:3000',
  
  // Database URL for build (dummy value)
  DATABASE_URL: 'postgresql://dummy:dummy@localhost:5432/dummy',
  
  // Redis URL for build (dummy value)
  REDIS_URL: 'redis://localhost:6379',
  
  // Stripe keys for build (dummy values)
  STRIPE_SECRET_KEY: 'sk_test_dummy_key_for_build',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_dummy_key_for_build',
  STRIPE_WEBHOOK_SECRET: 'whsec_dummy_webhook_secret',
  
  // App URLs for build
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
  
  // Skip environment validation during build
  SKIP_ENV_VALIDATION: 'true',
  
  // Build phase indicator
  NEXT_PHASE: 'phase-production-build',
  
  // Node environment
  NODE_ENV: 'production'
};

// Set environment variables
Object.entries(buildEnv).forEach(([key, value]) => {
  process.env[key] = value;
  console.log(`✅ Set ${key}=${value.substring(0, 20)}...`);
});

console.log('🚀 Running Next.js build...');

try {
  // Run the build command
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, ...buildEnv }
  });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
