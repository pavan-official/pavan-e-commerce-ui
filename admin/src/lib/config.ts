/**
 * Environment Configuration System - Admin
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

interface AuthConfig {
  nextAuthUrl: string;
  nextAuthSecret: string;
  adminEmail: string;
  adminPassword: string;
}

interface EmailConfig {
  from: string;
  serverHost: string;
  serverPort: number;
  serverUser: string;
  serverPassword: string;
}

interface SecurityConfig {
  rateLimitMax: number;
  rateLimitWindow: number;
}

// ===========================================
// CONFIGURATION VALIDATION
// ===========================================

class ConfigValidator {
  private static validateRequired(value: string | undefined, name: string): string {
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  private static validateUrl(value: string, name: string): string {
    try {
      new URL(value);
      return value;
    } catch {
      throw new Error(`Invalid URL for environment variable: ${name}`);
    }
  }

  private static validateNumber(value: string | undefined, name: string, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`Invalid number for environment variable: ${name}`);
    }
    return parsed;
  }

  private static validateBoolean(value: string | undefined, name: string, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private static validateEmail(value: string, name: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error(`Invalid email format for environment variable: ${name}`);
    }
    return value;
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

      // Database Configuration
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

      // Redis Configuration
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

      // Authentication Configuration
      auth: {
        nextAuthUrl: ConfigValidator.validateUrl(
          ConfigValidator.validateRequired(
            process.env.NEXTAUTH_URL,
            'NEXTAUTH_URL'
          ),
          'NEXTAUTH_URL'
        ),
        nextAuthSecret: ConfigValidator.validateRequired(
          process.env.NEXTAUTH_SECRET,
          'NEXTAUTH_SECRET'
        ),
        adminEmail: ConfigValidator.validateEmail(
          ConfigValidator.validateRequired(
            process.env.ADMIN_EMAIL,
            'ADMIN_EMAIL'
          ),
          'ADMIN_EMAIL'
        ),
        adminPassword: ConfigValidator.validateRequired(
          process.env.ADMIN_PASSWORD,
          'ADMIN_PASSWORD'
        ),
      } as AuthConfig,

      // Email Configuration
      email: {
        from: ConfigValidator.validateEmail(
          ConfigValidator.validateRequired(
            process.env.EMAIL_FROM,
            'EMAIL_FROM'
          ),
          'EMAIL_FROM'
        ),
        serverHost: ConfigValidator.validateRequired(
          process.env.EMAIL_SERVER_HOST,
          'EMAIL_SERVER_HOST'
        ),
        serverPort: ConfigValidator.validateNumber(
          process.env.EMAIL_SERVER_PORT,
          'EMAIL_SERVER_PORT',
          587
        ),
        serverUser: ConfigValidator.validateRequired(
          process.env.EMAIL_SERVER_USER,
          'EMAIL_SERVER_USER'
        ),
        serverPassword: ConfigValidator.validateRequired(
          process.env.EMAIL_SERVER_PASSWORD,
          'EMAIL_SERVER_PASSWORD'
        ),
      } as EmailConfig,

      // Security Configuration
      security: {
        rateLimitMax: ConfigValidator.validateNumber(
          process.env.RATE_LIMIT_MAX,
          'RATE_LIMIT_MAX',
          100
        ),
        rateLimitWindow: ConfigValidator.validateNumber(
          process.env.RATE_LIMIT_WINDOW,
          'RATE_LIMIT_WINDOW',
          900000
        ),
      } as SecurityConfig,

      // Development Configuration
      development: {
        debug: ConfigValidator.validateBoolean(
          process.env.NEXT_PUBLIC_DEBUG,
          'NEXT_PUBLIC_DEBUG',
          process.env.NODE_ENV === 'development'
        ),
        logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
      },

      // Analytics Configuration
      analytics: {
        gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      },
    };
  }

  public getConfig() {
    return this.config;
  }

  public getAppConfig(): AppConfig {
    return this.config.app;
  }

  public getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  public getRedisConfig(): RedisConfig {
    return this.config.redis;
  }

  public getAuthConfig(): AuthConfig {
    return this.config.auth;
  }

  public getEmailConfig(): EmailConfig {
    return this.config.email;
  }

  public getSecurityConfig(): SecurityConfig {
    return this.config.security;
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  public isDebugMode(): boolean {
    return this.config.development.debug;
  }
}

// ===========================================
// EXPORTED CONFIGURATION
// ===========================================

export const config = ConfigFactory.getInstance().getConfig();
export const appConfig = ConfigFactory.getInstance().getAppConfig();
export const databaseConfig = ConfigFactory.getInstance().getDatabaseConfig();
export const redisConfig = ConfigFactory.getInstance().getRedisConfig();
export const authConfig = ConfigFactory.getInstance().getAuthConfig();
export const emailConfig = ConfigFactory.getInstance().getEmailConfig();
export const securityConfig = ConfigFactory.getInstance().getSecurityConfig();

// Utility functions
export const isDevelopment = () => ConfigFactory.getInstance().isDevelopment();
export const isProduction = () => ConfigFactory.getInstance().isProduction();
export const isDebugMode = () => ConfigFactory.getInstance().isDebugMode();

// Default export
export default config;
