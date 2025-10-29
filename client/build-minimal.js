#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ultra-minimal build for custom authentication...');

try {
  // Create a minimal package.json for build
  const packageJson = {
    "name": "ecommerce-minimal",
    "version": "1.0.0",
    "scripts": {
      "build": "next build"
    },
    "dependencies": {
      "next": "15.5.6",
      "react": "^18.0.0",
      "react-dom": "^18.0.0"
    }
  };
  
  // Write minimal package.json
  fs.writeFileSync('package.minimal.json', JSON.stringify(packageJson, null, 2));
  
  console.log('📦 Attempting ultra-minimal build...');
  
  // Try building with minimal configuration
  execSync('npx next build --no-lint --no-typescript-check', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });
  
  console.log('✅ Ultra-minimal build successful!');
  
} catch (error) {
  console.log('❌ Ultra-minimal build failed');
  console.log('Error:', error.message);
  process.exit(1);
}

console.log('🎉 Ultra-minimal build completed successfully!');
