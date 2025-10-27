import { ProductsType, ProductType } from "@/types";

export interface FilterOptions {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SortOption {
  value: string;
  label: string;
  sortFn: (a: ProductType, b: ProductType) => number;
}

export const SORT_OPTIONS: Record<string, SortOption> = {
  newest: {
    value: 'newest',
    label: 'Newest',
    sortFn: (a, b) => Number(b.id) - Number(a.id)
  },
  oldest: {
    value: 'oldest',
    label: 'Oldest',
    sortFn: (a, b) => Number(a.id) - Number(b.id)
  },
  asc: {
    value: 'asc',
    label: 'Price: Low to High',
    sortFn: (a, b) => a.price - b.price
  },
  desc: {
    value: 'desc',
    label: 'Price: High to Low',
    sortFn: (a, b) => b.price - a.price
  }
};

export class ProductService {
  /**
   * Filter products based on provided options
   */
  static filterProducts(products: ProductsType, options: FilterOptions): ProductsType {
    let filtered = [...products];

    // Category filtering
    if (options.category && options.category !== 'all') {
      filtered = filtered.filter(product => product.category === options.category);
    }

    // Search filtering
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.shortDescription.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Price range filtering
    if (options.minPrice !== undefined) {
      filtered = filtered.filter(product => product.price >= options.minPrice!);
    }
    if (options.maxPrice !== undefined) {
      filtered = filtered.filter(product => product.price <= options.maxPrice!);
    }

    return filtered;
  }

  /**
   * Sort products based on sort option
   */
  static sortProducts(products: ProductsType, sortOption: string): ProductsType {
    const sortConfig = SORT_OPTIONS[sortOption];
    if (!sortConfig) {
      return products;
    }

    return [...products].sort(sortConfig.sortFn);
  }

  /**
   * Get unique categories from products
   */
  static getCategories(products: ProductsType): string[] {
    const categories = new Set(products.map(product => product.category));
    return Array.from(categories).sort();
  }

  /**
   * Get price range from products
   */
  static getPriceRange(products: ProductsType): { min: number; max: number } {
    if (products.length === 0) {
      return { min: 0, max: 0 };
    }

    const prices = products.map(product => product.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  /**
   * Search products with advanced matching
   */
  static searchProducts(products: ProductsType, query: string): ProductsType {
    if (!query.trim()) {
      return products;
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return products.filter(product => {
      const searchableText = [
        product.name,
        product.shortDescription,
        product.description,
        product.category
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  /**
   * Get filtered and sorted products
   */
  static getFilteredProducts(products: ProductsType, options: FilterOptions): ProductsType {
    let result = this.filterProducts(products, options);
    
    if (options.sort) {
      result = this.sortProducts(result, options.sort);
    }

    return result;
  }
}

