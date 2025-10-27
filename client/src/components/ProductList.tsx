"use client";
import { ProductsType } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Categories from "./Categories";
import Filter from "./Filter";
import ProductCard from "./ProductCard";

// API-based product fetching
interface ApiProduct {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  category: {
    name: string;
  };
  images: string[];
  thumbnail: string;
}

const ProductList = ({ category, params }: { category: string, params: "homepage" | "products" }) => {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductsType>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Get URL parameters
  const urlCategory = searchParams.get("category");
  const sort = searchParams.get("sort");
  const search = searchParams.get("search");

  // Use URL category if available, otherwise use prop category
  const activeCategory = urlCategory || category;

  // Handle hydration - ensure client-side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch products from API with retry logic
  const fetchProducts = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching products from API... (attempt ${retryCount + 1})`);
      const response = await fetch('/api/products/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 API Response:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Transform API data to match ProductType interface
        const transformedProducts: ProductsType = data.data.map((product: ApiProduct) => ({
          id: product.id,
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          price: parseFloat(product.price),
          category: product.category.name.toLowerCase().replace(/\s+/g, '-'),
          sizes: ["s", "m", "l", "xl"],
          colors: ["default"],
          images: product.images && product.images.length > 0 
            ? product.images.reduce((acc, img, index) => {
                acc[`color${index}`] = img;
                return acc;
              }, {} as Record<string, string>)
            : { default: product.thumbnail || "/products/placeholder.png" },
        }));
        
        console.log('✅ Products transformed:', transformedProducts.length);
        setProducts(transformedProducts);
        setLoading(false);
      } else {
        throw new Error('API returned unsuccessful response or invalid data');
      }
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Retry logic for production resilience
      if (retryCount < 3) {
        console.log(`🔄 Retrying in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          fetchProducts(retryCount + 1);
        }, (retryCount + 1) * 1000);
      } else {
        setError(`Error loading products: ${errorMessage}`);
        setLoading(false);
      }
    }
  }, []);

  // Fetch products when component mounts
  useEffect(() => {
    if (mounted) {
      fetchProducts();
    }
  }, [mounted, fetchProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Category filtering
    if (activeCategory && activeCategory !== 'all') {
      const categoryMapping: Record<string, string> = {
        'electronics': 'electronics',
        'clothing': 'clothing',
        'home-garden': 'home-garden',
        'shoes': 'shoes'
      };
      
      const mappedCategory = categoryMapping[activeCategory] || activeCategory;
      filtered = filtered.filter(product => 
        product.category === mappedCategory
      );
    }

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.shortDescription.toLowerCase().includes(searchLower)
      );
    }

    // Sort products
    if (sort) {
      switch (sort) {
        case 'price-low':
          filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
          break;
        case 'price-high':
          filtered = [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
          break;
        case 'name':
          filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [products, activeCategory, search, sort]);

  // Show loading state
  if (loading) {
    return (
      <div className="w-full">
        <Categories />
        {params === "products" && <Filter />}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full">
        <Categories />
        {params === "products" && <Filter />}
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchProducts();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show no products state
  if (filteredProducts.length === 0) {
    return (
      <div className="w-full">
        <Categories />
        {params === "products" && <Filter />}
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found for the selected criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Categories />
      {params === "products" && <Filter />}
      
      {/* Results count and active filters */}
      {params === "products" && (
        <div className="mb-4 text-sm text-gray-600">
          <p>
            Showing {filteredProducts.length} of {products.length} products
            {activeCategory && activeCategory !== 'all' && (
              <span> in <span className="font-medium">{activeCategory}</span></span>
            )}
            {search && (
              <span> for "<span className="font-medium">{search}</span>"</span>
            )}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      <Link
        href={activeCategory ? `/products/?category=${activeCategory}` : "/products"}
        className="flex justify-end mt-4 underline text-sm text-gray-500"
      >
        View all products
      </Link>
    </div>
  );
};

export default ProductList;