import { FilterOptions, ProductService } from "@/services/productService";
import { ProductsType, ProductType } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProductStoreState {
  products: ProductsType;
  filteredProducts: ProductsType;
  filters: FilterOptions;
  isLoading: boolean;
  error: string | null;
}

interface ProductStoreActions {
  setProducts: (products: ProductsType) => void;
  setFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  applyFilters: () => void;
  getProductById: (id: string | number) => ProductType | undefined;
  getProductsByCategory: (category: string) => ProductsType;
  searchProducts: (query: string) => ProductsType;
}

const defaultFilters: FilterOptions = {
  category: 'all',
  search: '',
  sort: 'newest'
};

export const useProductStore = create<ProductStoreState & ProductStoreActions>()(
  persist(
    (set, get) => ({
      // State
      products: [],
      filteredProducts: [],
      filters: defaultFilters,
      isLoading: false,
      error: null,

      // Actions
      setProducts: (products: ProductsType) => {
        set({ products });
        get().applyFilters();
      },

      setFilters: (filters: FilterOptions) => {
        set({ filters: { ...get().filters, ...filters } });
        get().applyFilters();
      },

      clearFilters: () => {
        set({ filters: defaultFilters });
        get().applyFilters();
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      applyFilters: () => {
        const { products, filters } = get();
        const filteredProducts = ProductService.getFilteredProducts(products, filters);
        set({ filteredProducts });
      },

      getProductById: (id: string | number) => {
        const { products } = get();
        return products.find(product => product.id === id);
      },

      getProductsByCategory: (category: string) => {
        const { products } = get();
        return ProductService.filterProducts(products, { category });
      },

      searchProducts: (query: string) => {
        const { products } = get();
        return ProductService.searchProducts(products, query);
      }
    }),
    {
      name: "product-store",
      partialize: (state) => ({ 
        filters: state.filters 
      }),
    }
  )
);

