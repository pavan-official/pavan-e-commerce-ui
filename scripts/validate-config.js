#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Validates environment variables and configuration for both client and admin applications
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}`),
};

// Configuration schemas
const clientConfigSchema = {
  required: [
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ],
  optional: [
    'NEXT_PUBLIC_CURRENCY',
    'NEXT_PUBLIC_CURRENCY_SYMBOL',
    'NEXT_PUBLIC_TAX_RATE',
    'NEXT_PUBLIC_ENABLE_ANALYTICS',
    'NEXT_PUBLIC_ENABLE_PAYMENTS',
    'NEXT_PUBLIC_ENABLE_REVIEWS',
    'NEXT_PUBLIC_ENABLE_WISHLIST',
    'NEXT_PUBLIC_ENABLE_NOTIFICATIONS',
    'NEXT_PUBLIC_DEBUG',
    'NEXT_PUBLIC_LOG_LEVEL',
  ],
  validators: {
    NEXT_PUBLIC_APP_URL: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    NEXT_PUBLIC_API_URL: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    NEXTAUTH_URL: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    NEXTAUTH_SECRET: (value) => {
      return value && value.length >= 32;
    },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: (value) => {
      return value && (value.startsWith('pk_test_') || value.startsWith('pk_live_'));
    },
    NEXT_PUBLIC_TAX_RATE: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0 && num <= 1;
    },
  },
};

const adminConfigSchema = {
  required: [
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_URL',
    'DATABASE_URL',
    'DATABASE_HOST',
    'DATABASE_NAME',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'REDIS_URL',
    'REDIS_HOST',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'EMAIL_FROM',
    'EMAIL_SERVER_HOST',
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
  ],
  optional: [
    'DATABASE_PORT',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'EMAIL_SERVER_PORT',
    'RATE_LIMIT_MAX',
    'RATE_LIMIT_WINDOW',
    'NEXT_PUBLIC_DEBUG',
    'NEXT_PUBLIC_LOG_LEVEL',
  ],
  validators: {
    NEXT_PUBLIC_APP_URL: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    DATABASE_URL: (value) => {
      return value && value.startsWith('postgresql://');
    },
    REDIS_URL: (value) => {
      return value && value.startsWith('redis://');
    },
    NEXTAUTH_URL: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    NEXTAUTH_SECRET: (value) => {
      return value && value.length >= 32;
    },
    ADMIN_EMAIL: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    EMAIL_FROM: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    DATABASE_PORT: (value) => {
      const port = parseInt(value);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    REDIS_PORT: (value) => {
      const port = parseInt(value);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    EMAIL_SERVER_PORT: (value) => {
      const port = parseInt(value);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
  },
};

// Load environment variables from file
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key.trim()] = value.trim();
      }
    }
  });

  return envVars;
}

// Validate configuration
function validateConfig(config, schema, appName) {
  log.header(`Validating ${appName} Configuration`);
  
  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  log.info('Checking required variables...');
  schema.required.forEach(key => {
    if (!config[key]) {
      log.error(`Missing required variable: ${key}`);
      hasErrors = true;
    } else {
      log.success(`✓ ${key}`);
    }
  });

  // Check optional variables
  log.info('Checking optional variables...');
  schema.optional.forEach(key => {
    if (config[key]) {
      log.success(`✓ ${key}`);
    } else {
      log.warning(`Optional variable not set: ${key}`);
      hasWarnings = true;
    }
  });

  // Validate values
  log.info('Validating variable values...');
  Object.keys(schema.validators).forEach(key => {
    if (config[key]) {
      const validator = schema.validators[key];
      if (validator(config[key])) {
        log.success(`✓ ${key} (valid format)`);
      } else {
        log.error(`Invalid format for ${key}: ${config[key]}`);
        hasErrors = true;
      }
    }
  });

  return { hasErrors, hasWarnings };
}

// Check for placeholder values
function checkPlaceholders(config, appName) {
  log.header(`Checking for Placeholder Values in ${appName}`);
  
  const placeholders = [
    'your_',
    'example_',
    'placeholder_',
    'change_me',
    'localhost',
    'username',
    'password',
    'secret',
  ];

  let foundPlaceholders = false;

  Object.entries(config).forEach(([key, value]) => {
    if (value && placeholders.some(placeholder => 
      value.toLowerCase().includes(placeholder.toLowerCase())
    )) {
      log.warning(`Potential placeholder value in ${key}: ${value}`);
      foundPlaceholders = true;
    }
  });

  if (!foundPlaceholders) {
    log.success('No placeholder values found');
  }

  return foundPlaceholders;
}

// Main validation function
function main() {
  console.log(`${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                    Configuration Validator                   ║
║                                                              ║
║  This script validates your environment configuration       ║
║  for both client and admin applications.                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  let totalErrors = 0;
  let totalWarnings = 0;

  // Validate client configuration
  const clientEnvPath = path.join(__dirname, '..', 'client', '.env.local');
  const clientConfig = loadEnvFile(clientEnvPath);
  
  if (Object.keys(clientConfig).length === 0) {
    log.error('Client .env.local file not found or empty');
    log.info('Please copy client/.env.example to client/.env.local and configure it');
    totalErrors++;
  } else {
    const clientResult = validateConfig(clientConfig, clientConfigSchema, 'Client');
    if (clientResult.hasErrors) totalErrors++;
    if (clientResult.hasWarnings) totalWarnings++;
    
    const clientPlaceholders = checkPlaceholders(clientConfig, 'Client');
    if (clientPlaceholders) totalWarnings++;
  }

  // Validate admin configuration
  const adminEnvPath = path.join(__dirname, '..', 'admin', '.env.local');
  const adminConfig = loadEnvFile(adminEnvPath);
  
  if (Object.keys(adminConfig).length === 0) {
    log.error('Admin .env.local file not found or empty');
    log.info('Please copy admin/.env.example to admin/.env.local and configure it');
    totalErrors++;
  } else {
    const adminResult = validateConfig(adminConfig, adminConfigSchema, 'Admin');
    if (adminResult.hasErrors) totalErrors++;
    if (adminResult.hasWarnings) totalWarnings++;
    
    const adminPlaceholders = checkPlaceholders(adminConfig, 'Admin');
    if (adminPlaceholders) totalWarnings++;
  }

  // Summary
  log.header('Validation Summary');
  
  if (totalErrors === 0 && totalWarnings === 0) {
    log.success('✅ All configurations are valid!');
    console.log(`\n${colors.green}You're ready to start development! 🚀${colors.reset}`);
  } else if (totalErrors === 0) {
    log.warning(`⚠️  Configuration has ${totalWarnings} warning(s) but is functional`);
    console.log(`\n${colors.yellow}You can start development, but consider fixing the warnings.${colors.reset}`);
  } else {
    log.error(`❌ Configuration has ${totalErrors} error(s) and ${totalWarnings} warning(s)`);
    console.log(`\n${colors.red}Please fix the errors before starting development.${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
  console.log('1. Fix any errors or warnings above');
  console.log('2. Start PostgreSQL and Redis services');
  console.log('3. Run "pnpm dev" in both client and admin directories');
  console.log('4. Visit http://localhost:3000 (client) and http://localhost:3001 (admin)');
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { validateConfig, loadEnvFile };
