"use client";
import { ProductsType } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

  // Fetch products from API
  useEffect(() => {
    if (!mounted) return; // Don't fetch until mounted

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
          // Transform API data to match ProductType interface
          const transformedProducts: ProductsType = data.data.map((product: ApiProduct) => ({
            id: product.id, // Use string ID from database
            name: product.name,
            shortDescription: product.shortDescription,
            description: product.description,
            price: parseFloat(product.price), // Convert string to number
            category: product.category.name.toLowerCase().replace(/\s+/g, '-'), // Convert to slug format
            sizes: ["s", "m", "l", "xl"], // Default sizes for now
            colors: ["default"], // Default color for now
            images: product.images && product.images.length > 0 
              ? product.images.reduce((acc, img, index) => {
                  acc[`color${index}`] = img;
                  return acc;
                }, {} as Record<string, string>)
              : { default: product.thumbnail || "/products/placeholder.png" },
          }));
          setProducts(transformedProducts);
        } else {
          setError('Failed to fetch products');
        }
      } catch (err) {
        setError('Error loading products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, mounted]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Category filtering using shared config
    if (activeCategory && activeCategory !== 'all') {
      // Import the mapping function at the top of the file
      // For now, use inline mapping to avoid circular dependency
      const categoryMapping: Record<string, string> = {
        't-shirts': 'clothing',
        'shoes': 'shoes',
        'accessories': 'electronics',
        'bags': 'home-garden',
        'dresses': 'clothing',
        'jackets': 'clothing',
        'gloves': 'home-garden',
      };
      const dbCategory = categoryMapping[activeCategory] || activeCategory;
      filtered = filtered.filter(product => product.category === dbCategory);
    }

    // Search filtering
    if (search) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.shortDescription.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sorting
    if (sort) {
      switch (sort) {
        case 'asc':
          filtered = [...filtered].sort((a, b) => a.price - b.price);
          break;
        case 'desc':
          filtered = [...filtered].sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          // For string IDs, we'll sort by name for now
          filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'oldest':
          filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [products, activeCategory, search, sort]);

  if (loading || !mounted) {
    return (
      <div className="w-full">
        <Categories />
        {params === "products" && <Filter />}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
          {/* Loading skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Categories />
        {params === "products" && <Filter />}
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">{error}</p>
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
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found for the selected criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}
      
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