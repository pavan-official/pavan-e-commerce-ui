import { ApiResponse, GenericObject, GenericGenericFunction, ErrorResponse } from '@/types/common';
/**
 * Environment Configuration System
 * Centralized configuration management with validation
 */

// ===========================================
// CONFIGURATION INTERFACES
// ===========================================

interface AppConfig {
  name: string;
  url: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

interface ApiConfig {
  url: string;
  timeout: number;
}

interface PaymentConfig {
  stripePublishableKey: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
}

interface FeatureFlags {
  analytics: boolean;
  payments: boolean;
  reviews: boolean;
  wishlist: boolean;
  notifications: boolean;
}

interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password?: string;
}

// ===========================================
// CONFIGURATION VALIDATION
// ===========================================

class ConfigValidator {
  public static validateRequired(value: string | undefined, name: string): string {
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  public static validateUrl(value: string, name: string): string {
    try {
      new URL(value);
      return value;
    } catch {
      throw new Error(`Invalid URL for environment variable: ${name}`);
    }
  }

  public static validateNumber(value: string | undefined, name: string, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`Invalid number for environment variable: ${name}`);
    }
    return parsed;
  }

  public static validateBoolean(value: string | undefined, name: string, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }
}

// ===========================================
// CONFIGURATION FACTORY
// ===========================================

class ConfigFactory {
  private static instance: ConfigFactory;
  private config: any;

  private constructor() {
    this.config = this.buildConfig();
  }

  public static getInstance(): ConfigFactory {
    if (!ConfigFactory.instance) {
      ConfigFactory.instance = new ConfigFactory();
    }
    return ConfigFactory.instance;
  }

  private buildConfig() {
    const isServer = typeof window === 'undefined';
    
    return {
      // Application Configuration
      app: {
        name: ConfigValidator.validateRequired(
          process.env.NEXT_PUBLIC_APP_NAME,
          'NEXT_PUBLIC_APP_NAME'
        ),
        url: ConfigValidator.validateUrl(
          ConfigValidator.validateRequired(
            process.env.NEXT_PUBLIC_APP_URL,
            'NEXT_PUBLIC_APP_URL'
          ),
          'NEXT_PUBLIC_APP_URL'
        ),
        version: ConfigValidator.validateRequired(
          process.env.NEXT_PUBLIC_APP_VERSION,
          'NEXT_PUBLIC_APP_VERSION'
        ),
        environment: (process.env.NEXT_PUBLIC_APP_ENVIRONMENT || 'development') as 'development' | 'staging' | 'production',
      } as AppConfig,

      // API Configuration
      api: {
        url: ConfigValidator.validateUrl(
          ConfigValidator.validateRequired(
            process.env.NEXT_PUBLIC_API_URL,
            'NEXT_PUBLIC_API_URL'
          ),
          'NEXT_PUBLIC_API_URL'
        ),
        timeout: ConfigValidator.validateNumber(
          process.env.NEXT_PUBLIC_API_TIMEOUT,
          'NEXT_PUBLIC_API_TIMEOUT',
          10000
        ),
      } as ApiConfig,

      // Payment Configuration
      payment: {
        stripePublishableKey: ConfigValidator.validateRequired(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
        ),
        currency: process.env.NEXT_PUBLIC_CURRENCY || 'USD',
        currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$',
        taxRate: ConfigValidator.validateNumber(
          process.env.NEXT_PUBLIC_TAX_RATE,
          'NEXT_PUBLIC_TAX_RATE',
          0.08
        ),
      } as PaymentConfig,

      // Feature Flags
      features: {
        analytics: ConfigValidator.validateBoolean(
          process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
          'NEXT_PUBLIC_ENABLE_ANALYTICS',
          true
        ),
        payments: ConfigValidator.validateBoolean(
          process.env.NEXT_PUBLIC_ENABLE_PAYMENTS,
          'NEXT_PUBLIC_ENABLE_PAYMENTS',
          true
        ),
        reviews: ConfigValidator.validateBoolean(
          process.env.NEXT_PUBLIC_ENABLE_REVIEWS,
          'NEXT_PUBLIC_ENABLE_REVIEWS',
          true
        ),
        wishlist: ConfigValidator.validateBoolean(
          process.env.NEXT_PUBLIC_ENABLE_WISHLIST,
          'NEXT_PUBLIC_ENABLE_WISHLIST',
          true
        ),
        notifications: ConfigValidator.validateBoolean(
          process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS,
          'NEXT_PUBLIC_ENABLE_NOTIFICATIONS',
          true
        ),
      } as FeatureFlags,

      // Development Configuration
      development: {
        debug: ConfigValidator.validateBoolean(
          process.env.NEXT_PUBLIC_DEBUG,
          'NEXT_PUBLIC_DEBUG',
          process.env.NODE_ENV === 'development'
        ),
        logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
      },

      // Server-only configuration (only available on server side)
      ...(isServer && {
        database: {
          url: ConfigValidator.validateRequired(
            process.env.DATABASE_URL,
            'DATABASE_URL'
          ),
          host: ConfigValidator.validateRequired(
            process.env.DATABASE_HOST,
            'DATABASE_HOST'
          ),
          port: ConfigValidator.validateNumber(
            process.env.DATABASE_PORT,
            'DATABASE_PORT',
            5432
          ),
          name: ConfigValidator.validateRequired(
            process.env.DATABASE_NAME,
            'DATABASE_NAME'
          ),
          user: ConfigValidator.validateRequired(
            process.env.DATABASE_USER,
            'DATABASE_USER'
          ),
          password: ConfigValidator.validateRequired(
            process.env.DATABASE_PASSWORD,
            'DATABASE_PASSWORD'
          ),
        } as DatabaseConfig,

        redis: {
          url: ConfigValidator.validateRequired(
            process.env.REDIS_URL,
            'REDIS_URL'
          ),
          host: ConfigValidator.validateRequired(
            process.env.REDIS_HOST,
            'REDIS_HOST'
          ),
          port: ConfigValidator.validateNumber(
            process.env.REDIS_PORT,
            'REDIS_PORT',
            6379
          ),
          password: process.env.REDIS_PASSWORD,
        } as RedisConfig,

        auth: {
          nextAuthUrl: ConfigValidator.validateRequired(
            process.env.NEXTAUTH_URL,
            'NEXTAUTH_URL'
          ),
          nextAuthSecret: ConfigValidator.validateRequired(
            process.env.NEXTAUTH_SECRET,
            'NEXTAUTH_SECRET'
          ),
        },

        stripe: {
          secretKey: ConfigValidator.validateRequired(
            process.env.STRIPE_SECRET_KEY,
            'STRIPE_SECRET_KEY'
          ),
          webhookSecret: ConfigValidator.validateRequired(
            process.env.STRIPE_WEBHOOK_SECRET,
            'STRIPE_WEBHOOK_SECRET'
          ),
        },
      }),
    };
  }

  public getConfig() {
    return this.config;
  }

  public getAppConfig(): AppConfig {
    return this.config.app;
  }

  public getApiConfig(): ApiConfig {
    return this.config.api;
  }

  public getPaymentConfig(): PaymentConfig {
    return this.config.payment;
  }

  public getFeatureFlags(): FeatureFlags {
    return this.config.features;
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }
}

// ===========================================
// EXPORTED CONFIGURATION
// ===========================================

export const config = ConfigFactory.getInstance().getConfig();
export const appConfig = ConfigFactory.getInstance().getAppConfig();
export const apiConfig = ConfigFactory.getInstance().getApiConfig();
export const paymentConfig = ConfigFactory.getInstance().getPaymentConfig();
export const featureFlags = ConfigFactory.getInstance().getFeatureFlags();

// Utility functions
export const isDevelopment = () => ConfigFactory.getInstance().isDevelopment();
export const isProduction = () => ConfigFactory.getInstance().isProduction();
export const isFeatureEnabled = (feature: keyof FeatureFlags) => 
  ConfigFactory.getInstance().isFeatureEnabled(feature);

// Default export
export default config;
