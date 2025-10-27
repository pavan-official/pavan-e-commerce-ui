/**
 * Category Mapping Tests
 * 
 * These tests ensure category mappings remain consistent between
 * frontend and database categories.
 */

import {
    getAllDatabaseCategories,
    getAllFrontendCategories,
    isDatabaseCategory,
    isFrontendCategory,
    mapDatabaseToFrontend,
    mapFrontendToDatabase,
} from '@/config/categories';

describe('Category Mapping Configuration', () => {
  describe('Frontend to Database Mapping', () => {
    it('should map t-shirts to clothing', () => {
      expect(mapFrontendToDatabase('t-shirts')).toBe('clothing');
    });

    it('should map dresses to clothing', () => {
      expect(mapFrontendToDatabase('dresses')).toBe('clothing');
    });

    it('should map jackets to clothing', () => {
      expect(mapFrontendToDatabase('jackets')).toBe('clothing');
    });

    it('should map shoes to shoes', () => {
      expect(mapFrontendToDatabase('shoes')).toBe('shoes');
    });

    it('should map accessories to electronics', () => {
      expect(mapFrontendToDatabase('accessories')).toBe('electronics');
    });

    it('should map bags to home-garden', () => {
      expect(mapFrontendToDatabase('bags')).toBe('home-garden');
    });

    it('should map gloves to home-garden', () => {
      expect(mapFrontendToDatabase('gloves')).toBe('home-garden');
    });

    it('should return unknown category as-is with warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = mapFrontendToDatabase('unknown-category');
      
      expect(result).toBe('unknown-category');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown frontend category')
      );
      
      consoleSpy.mockRestore();
    });

    it('should map all frontend categories to valid database categories', () => {
      const frontendCategories = getAllFrontendCategories();
      const databaseCategories = getAllDatabaseCategories();

      frontendCategories.forEach(frontend => {
        const db = mapFrontendToDatabase(frontend);
        expect(databaseCategories).toContain(db);
      });
    });
  });

  describe('Database to Frontend Mapping', () => {
    it('should map clothing to t-shirts, dresses, jackets', () => {
      const result = mapDatabaseToFrontend('clothing');
      expect(result).toEqual(expect.arrayContaining(['t-shirts', 'dresses', 'jackets']));
      expect(result).toHaveLength(3);
    });

    it('should map shoes to shoes', () => {
      const result = mapDatabaseToFrontend('shoes');
      expect(result).toEqual(['shoes']);
    });

    it('should map electronics to accessories', () => {
      const result = mapDatabaseToFrontend('electronics');
      expect(result).toEqual(['accessories']);
    });

    it('should map home-garden to bags and gloves', () => {
      const result = mapDatabaseToFrontend('home-garden');
      expect(result).toEqual(expect.arrayContaining(['bags', 'gloves']));
      expect(result).toHaveLength(2);
    });

    it('should return unknown category as array with warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = mapDatabaseToFrontend('unknown-category');
      
      expect(result).toEqual(['unknown-category']);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown database category')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Bidirectional Mapping Consistency', () => {
    it('should maintain consistency for all frontend categories', () => {
      const frontendCategories = getAllFrontendCategories();

      frontendCategories.forEach(frontend => {
        const db = mapFrontendToDatabase(frontend);
        const backToFrontend = mapDatabaseToFrontend(db);
        
        expect(backToFrontend).toContain(frontend);
      });
    });

    it('should maintain consistency for all database categories', () => {
      const databaseCategories = getAllDatabaseCategories();

      databaseCategories.forEach(db => {
        const frontends = mapDatabaseToFrontend(db);
        
        frontends.forEach(frontend => {
          const backToDb = mapFrontendToDatabase(frontend);
          expect(backToDb).toBe(db);
        });
      });
    });
  });

  describe('Type Guards', () => {
    it('should identify valid frontend categories', () => {
      expect(isFrontendCategory('t-shirts')).toBe(true);
      expect(isFrontendCategory('shoes')).toBe(true);
      expect(isFrontendCategory('accessories')).toBe(true);
      expect(isFrontendCategory('invalid')).toBe(false);
    });

    it('should identify valid database categories', () => {
      expect(isDatabaseCategory('clothing')).toBe(true);
      expect(isDatabaseCategory('shoes')).toBe(true);
      expect(isDatabaseCategory('electronics')).toBe(true);
      expect(isDatabaseCategory('home-garden')).toBe(true);
      expect(isDatabaseCategory('invalid')).toBe(false);
    });
  });

  describe('Category Lists', () => {
    it('should return all frontend categories', () => {
      const categories = getAllFrontendCategories();
      
      expect(categories).toContain('t-shirts');
      expect(categories).toContain('dresses');
      expect(categories).toContain('jackets');
      expect(categories).toContain('shoes');
      expect(categories).toContain('accessories');
      expect(categories).toContain('bags');
      expect(categories).toContain('gloves');
      expect(categories).toHaveLength(7);
    });

    it('should return all database categories', () => {
      const categories = getAllDatabaseCategories();
      
      expect(categories).toContain('clothing');
      expect(categories).toContain('shoes');
      expect(categories).toContain('electronics');
      expect(categories).toContain('home-garden');
      expect(categories).toHaveLength(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(mapFrontendToDatabase('')).toBe('');
      expect(mapDatabaseToFrontend('')).toEqual(['']);
      
      consoleSpy.mockRestore();
    });

    it('should handle special characters', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(mapFrontendToDatabase('t-shirts!')).toBe('t-shirts!');
      expect(mapDatabaseToFrontend('clothing!')).toEqual(['clothing!']);
      
      consoleSpy.mockRestore();
    });

    it('should be case-sensitive', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(mapFrontendToDatabase('T-Shirts')).toBe('T-Shirts');
      expect(mapFrontendToDatabase('t-shirts')).toBe('clothing');
      
      consoleSpy.mockRestore();
    });
  });
});



