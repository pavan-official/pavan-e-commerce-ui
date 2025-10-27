/**
 * Category Configuration - Single Source of Truth
 * 
 * This file defines the mapping between frontend categories (user-facing)
 * and database categories (data storage).
 * 
 * IMPORTANT: Always use the helper functions when working with categories!
 */

// Database category types
export type DatabaseCategory = 
  | 'clothing'
  | 'shoes'
  | 'electronics'
  | 'home-garden';

// Frontend category types
export type FrontendCategory = 
  | 't-shirts'
  | 'dresses'
  | 'jackets'
  | 'shoes'
  | 'accessories'
  | 'bags'
  | 'gloves';

// Category configuration
export const CATEGORY_CONFIG = {
  clothing: {
    name: 'Clothing',
    slug: 'clothing',
    frontendSlugs: ['t-shirts', 'dresses', 'jackets'] as const,
    displayName: 'Clothing',
    icon: 'shirt',
  },
  shoes: {
    name: 'Shoes',
    slug: 'shoes',
    frontendSlugs: ['shoes'] as const,
    displayName: 'Shoes',
    icon: 'footprints',
  },
  electronics: {
    name: 'Electronics',
    slug: 'electronics',
    frontendSlugs: ['accessories'] as const,
    displayName: 'Electronics',
    icon: 'glasses',
  },
  'home-garden': {
    name: 'Home & Garden',
    slug: 'home-garden',
    frontendSlugs: ['bags', 'gloves'] as const,
    displayName: 'Home & Garden',
    icon: 'briefcase',
  },
} as const;

// Frontend to Database mapping
const FRONTEND_TO_DB_MAPPING: Record<FrontendCategory, DatabaseCategory> = {
  't-shirts': 'clothing',
  'dresses': 'clothing',
  'jackets': 'clothing',
  'shoes': 'shoes',
  'accessories': 'electronics',
  'bags': 'home-garden',
  'gloves': 'home-garden',
};

// Database to Frontend mapping (reverse)
const DB_TO_FRONTEND_MAPPING: Record<DatabaseCategory, FrontendCategory[]> = {
  'clothing': ['t-shirts', 'dresses', 'jackets'],
  'shoes': ['shoes'],
  'electronics': ['accessories'],
  'home-garden': ['bags', 'gloves'],
};

/**
 * Map a frontend category to its corresponding database category
 * @param frontendCategory - The frontend category slug (e.g., 't-shirts')
 * @returns The database category slug (e.g., 'clothing')
 */
export function mapFrontendToDatabase(frontendCategory: string): string {
  const mapped = FRONTEND_TO_DB_MAPPING[frontendCategory as FrontendCategory];
  
  if (!mapped) {
    console.warn(`⚠️ Unknown frontend category: "${frontendCategory}". Returning as-is.`);
    return frontendCategory;
  }
  
  return mapped;
}

/**
 * Map a database category to its corresponding frontend categories
 * @param dbCategory - The database category slug (e.g., 'clothing')
 * @returns Array of frontend category slugs (e.g., ['t-shirts', 'dresses', 'jackets'])
 */
export function mapDatabaseToFrontend(dbCategory: string): string[] {
  const mapped = DB_TO_FRONTEND_MAPPING[dbCategory as DatabaseCategory];
  
  if (!mapped) {
    console.warn(`⚠️ Unknown database category: "${dbCategory}". Returning as array.`);
    return [dbCategory];
  }
  
  return mapped;
}

/**
 * Check if a string is a valid frontend category
 */
export function isFrontendCategory(value: string): value is FrontendCategory {
  return value in FRONTEND_TO_DB_MAPPING;
}

/**
 * Check if a string is a valid database category
 */
export function isDatabaseCategory(value: string): value is DatabaseCategory {
  return value in DB_TO_FRONTEND_MAPPING;
}

/**
 * Get all frontend categories
 */
export function getAllFrontendCategories(): FrontendCategory[] {
  return Object.keys(FRONTEND_TO_DB_MAPPING) as FrontendCategory[];
}

/**
 * Get all database categories
 */
export function getAllDatabaseCategories(): DatabaseCategory[] {
  return Object.keys(DB_TO_FRONTEND_MAPPING) as DatabaseCategory[];
}

/**
 * Validate category mappings (development only)
 */
export function validateCategoryMappings() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Validating category mappings...');
    
    const frontendCategories = getAllFrontendCategories();
    const databaseCategories = getAllDatabaseCategories();
    
    let hasErrors = false;
    
    // Check all frontend categories have a valid database mapping
    frontendCategories.forEach(frontend => {
      const db = mapFrontendToDatabase(frontend);
      if (!databaseCategories.includes(db as DatabaseCategory)) {
        console.error(`❌ Frontend category "${frontend}" maps to unknown database category "${db}"`);
        hasErrors = true;
      }
    });
    
    // Check all database categories can be mapped back to frontend
    databaseCategories.forEach(db => {
      const frontends = mapDatabaseToFrontend(db);
      if (frontends.length === 0) {
        console.error(`❌ Database category "${db}" has no frontend mappings`);
        hasErrors = true;
      }
      
      // Verify bidirectional mapping
      frontends.forEach(frontend => {
        const backToDb = mapFrontendToDatabase(frontend);
        if (backToDb !== db) {
          console.error(`❌ Mapping inconsistency: ${frontend} → ${backToDb} (expected ${db})`);
          hasErrors = true;
        }
      });
    });
    
    if (hasErrors) {
      console.error('❌ Category mapping validation FAILED');
    } else {
      console.log('✅ Category mapping validation passed');
      console.log(`   - ${frontendCategories.length} frontend categories`);
      console.log(`   - ${databaseCategories.length} database categories`);
    }
  }
}

// Run validation on module load in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  validateCategoryMappings();
}



