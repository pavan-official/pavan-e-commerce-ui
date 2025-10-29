import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  rating?: number;
  sortBy?: "name" | "price" | "rating" | "createdAt" | "popularity";
  sortOrder?: "asc" | "desc";
}

interface SearchAggregations {
  price: {
    min: number;
    max: number;
    avg: number;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  thumbnail?: string;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: Array<{
    id: string;
    name: string;
    price: number;
    sku?: string;
    attributes?: Record<string, string>;
  }>;
  averageRating: number;
  reviewCount: number;
  quantity: number;
  isFeatured: boolean;
  createdAt: string;
}

interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SearchState {
  // Search data
  results: SearchResult[];
  aggregations: SearchAggregations | null;
  pagination: SearchPagination | null;
  filters: SearchFilters;
  appliedFilters: SearchFilters;

  // UI state
  isLoading: boolean;
  error: string | null;
  suggestions: Array<{
    id: string;
    name: string;
    type: "product" | "category" | "term";
    slug?: string;
  }>;
  isSuggestionsLoading: boolean;

  // Search history
  searchHistory: string[];
  recentSearches: string[];
}

interface SearchActions {
  // Search operations
  search: (filters?: Partial<SearchFilters>) => Promise<void>;
  searchSuggestions: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Filter operations
  setFilters: (filters: Partial<SearchFilters>) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  resetFilters: () => void;

  // Pagination
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // Search history
  addToHistory: (query: string) => void;
  clearHistory: () => void;

  // Local state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuggestions: (
    suggestions: Array<{
      id: string;
      name: string;
      type: "product" | "category" | "term";
      slug?: string;
    }>
  ) => void;
  setSuggestionsLoading: (loading: boolean) => void;
}

const initialFilters: SearchFilters = {
  sortBy: "createdAt",
  sortOrder: "desc",
};

const _initialPagination: SearchPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export const useSearchStore = create<SearchState & SearchActions>()(
  persist(
    (set, get) => ({
      // Initial state
      results: [],
      aggregations: null,
      pagination: null,
      filters: { ...initialFilters },
      appliedFilters: { ...initialFilters },
      isLoading: false,
      error: null,
      suggestions: [],
      isSuggestionsLoading: false,
      searchHistory: [],
      recentSearches: [],

      // Actions
      search: async (newFilters?: Partial<SearchFilters>) => {
        const { filters, pagination } = get();

        set({ isLoading: true, error: null });

        try {
          // Merge new filters with existing ones
          const searchFilters = { ...filters, ...newFilters };

          // Build query parameters
          const params = new URLSearchParams();

          Object.entries(searchFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              params.append(key, String(value));
            }
          });

          // Add pagination
          if (pagination) {
            params.append("page", String(pagination.page));
            params.append("limit", String(pagination.limit));
          }

          const response = await fetch(`/api/search/?${params.toString()}`);
          const data = await response.json();

          if (data.success) {
            set({
              results: data.data.products,
              aggregations: data.data.aggregations,
              pagination: data.data.pagination,
              appliedFilters: data.data.filters.applied,
              isLoading: false,
            });

            // Add to search history if there's a query
            if (searchFilters.q) {
              get().addToHistory(searchFilters.q);
            }
          } else {
            set({
              error: data.error?.message || "Search failed",
              isLoading: false,
            });
          }
        } catch (_error) {
          set({
            error: "An error occurred during search",
            isLoading: false,
          });
        }
      },

      searchSuggestions: async (query: string) => {
        if (!query.trim()) {
          set({ suggestions: [] });
          return;
        }

        set({ isSuggestionsLoading: true });

        try {
          const response = await fetch(
            `/api/search/suggestions/?q=${encodeURIComponent(query)}&limit=5`
          );
          const data = await response.json();

          if (data.success) {
            set({
              suggestions: [
                ...data.data.products,
                ...data.data.categories,
                ...data.data.terms,
              ],
              isSuggestionsLoading: false,
            });
          } else {
            set({
              suggestions: [],
              isSuggestionsLoading: false,
            });
          }
        } catch (_error) {
          set({
            suggestions: [],
            isSuggestionsLoading: false,
          });
        }
      },

      clearSearch: () => {
        set({
          results: [],
          aggregations: null,
          pagination: null,
          error: null,
        });
      },

      setFilters: (newFilters: Partial<SearchFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      applyFilters: () => {
        const { filters, search } = get();
        set({ appliedFilters: { ...filters } });
        search(filters);
      },

      clearFilters: () => {
        set({
          filters: { ...initialFilters },
          appliedFilters: { ...initialFilters },
        });
        get().search();
      },

      resetFilters: () => {
        set({
          filters: { ...initialFilters },
        });
      },

      setPage: (page: number) => {
        set((state) => ({
          pagination: state.pagination ? { ...state.pagination, page } : null,
        }));
        get().search();
      },

      nextPage: () => {
        const { pagination } = get();
        if (pagination && pagination.hasNext) {
          get().setPage(pagination.page + 1);
        }
      },

      prevPage: () => {
        const { pagination } = get();
        if (pagination && pagination.hasPrev) {
          get().setPage(pagination.page - 1);
        }
      },

      addToHistory: (query: string) => {
        set((state) => {
          const newHistory = [
            query,
            ...state.searchHistory.filter((item) => item !== query),
          ].slice(0, 10);
          const newRecentSearches = [
            query,
            ...state.recentSearches.filter((item) => item !== query),
          ].slice(0, 5);

          return {
            searchHistory: newHistory,
            recentSearches: newRecentSearches,
          };
        });
      },

      clearHistory: () => {
        set({
          searchHistory: [],
          recentSearches: [],
        });
      },

      // Local state setters
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setSuggestions: (
        suggestions: Array<{
          id: string;
          name: string;
          type: "product" | "category" | "term";
          slug?: string;
        }>
      ) => set({ suggestions }),
      setSuggestionsLoading: (loading: boolean) =>
        set({ isSuggestionsLoading: loading }),
    }),
    {
      name: "search-storage",
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        recentSearches: state.recentSearches,
        filters: state.filters,
      }),
    }
  )
);
