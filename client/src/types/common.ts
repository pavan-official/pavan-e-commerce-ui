/**
 * Common Type Definitions
 * QA-approved types to replace 'any' usage
 */

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Types
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
}

// Generic Event Types
export interface GenericEvent {
  type: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

// Form Data Types
export interface FormData {
  [key: string]: string | number | boolean | File | null;
}

// Generic Object Types
export interface GenericObject {
  [key: string]: unknown;
}

// GenericFunction Types
export type GenericGenericFunction = (...args: unknown[]) => unknown;
export type AsyncGenericFunction = (...args: unknown[]) => Promise<unknown>;

// Request/Response Types
export interface RequestData {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface ResponseData {
  status: number;
  data?: unknown;
  headers?: Record<string, string>;
}

// Store Types
export interface StoreState {
  [key: string]: unknown;
}

export interface StoreAction {
  type: string;
  payload?: unknown;
}

// Component Props Types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Database Types
export interface DatabaseRecord {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Configuration Types
export interface AppConfig {
  [key: string]: string | number | boolean | undefined;
}

// Event Handler Types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Generic Hook Types
export interface HookResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search Types
export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Notification Types
export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
}

// Analytics Types
export interface AnalyticsData {
  [key: string]: number | string | boolean;
}

export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
}

// Cache Types
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
}

// Logger Types
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

// Security Types
export interface SecurityContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  permissions?: string[];
  session?: {
    id: string;
    expiresAt: string;
  };
}
