"use client";
import { ProductsType } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import Categories from "./Categories";
import Filter from "./Filter";
import ProductCard from "./ProductCard";

// TEMPORARY
const products: ProductsType = [
  {
    id: 1,
    name: "Adidas CoreFit T-Shirt",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 39.9,
    category: "t-shirts",
    sizes: ["s", "m", "l", "xl", "xxl"],
    colors: ["gray", "purple", "green"],
    images: {
      gray: "/products/1g.png",
      purple: "/products/1p.png",
      green: "/products/1gr.png",
    },
  },
  {
    id: 2,
    name: "Puma Ultra Warm Zip",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 59.9,
    category: "jackets",
    sizes: ["s", "m", "l", "xl"],
    colors: ["gray", "green"],
    images: { gray: "/products/2g.png", green: "/products/2gr.png" },
  },
  {
    id: 3,
    name: "Nike Air Essentials Pullover",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 69.9,
    category: "jackets",
    sizes: ["s", "m", "l"],
    colors: ["green", "blue", "black"],
    images: {
      green: "/products/3gr.png",
      blue: "/products/3b.png",
      black: "/products/3bl.png",
    },
  },
  {
    id: 4,
    name: "Nike Dri Flex T-Shirt",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 29.9,
    category: "t-shirts",
    sizes: ["s", "m", "l"],
    colors: ["white", "pink"],
    images: { white: "/products/4w.png", pink: "/products/4p.png" },
  },
  {
    id: 5,
    name: "Under Armour StormFleece",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 49.9,
    category: "jackets",
    sizes: ["s", "m", "l"],
    colors: ["red", "orange", "black"],
    images: {
      red: "/products/5r.png",
      orange: "/products/5o.png",
      black: "/products/5bl.png",
    },
  },
  {
    id: 6,
    name: "Nike Air Max 270",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 59.9,
    category: "shoes",
    sizes: ["40", "42", "43", "44"],
    colors: ["gray", "white"],
    images: { gray: "/products/6g.png", white: "/products/6w.png" },
  },
  {
    id: 7,
    name: "Nike Ultraboost Pulse ",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 69.9,
    category: "shoes",
    sizes: ["40", "42", "43"],
    colors: ["gray", "pink"],
    images: { gray: "/products/7g.png", pink: "/products/7p.png" },
  },
  {
    id: 8,
    name: "Levi's Classic Denim",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 59.9,
    category: "t-shirts",
    sizes: ["s", "m", "l"],
    colors: ["blue", "green"],
    images: { blue: "/products/8b.png", green: "/products/8gr.png" },
  },
  // Additional products for better filtering demonstration
  {
    id: 9,
    name: "Ray-Ban Classic Sunglasses",
    shortDescription: "Classic aviator sunglasses with UV protection.",
    description: "Timeless aviator sunglasses with premium lenses and UV protection. Perfect for any outdoor activity.",
    price: 149.9,
    category: "accessories",
    sizes: ["one-size"],
    colors: ["black", "brown", "silver"],
    images: {
      black: "/products/accessories/sunglasses-black.png",
      brown: "/products/accessories/sunglasses-brown.png",
      silver: "/products/accessories/sunglasses-silver.png",
    },
  },
  {
    id: 10,
    name: "Leather Crossbody Bag",
    shortDescription: "Premium leather crossbody bag for everyday use.",
    description: "Handcrafted leather crossbody bag with multiple compartments and adjustable strap.",
    price: 89.9,
    category: "bags",
    sizes: ["one-size"],
    colors: ["brown", "black"],
    images: {
      brown: "/products/bags/crossbody-brown.png",
      black: "/products/bags/crossbody-black.png",
    },
  },
  {
    id: 11,
    name: "Summer Floral Dress",
    shortDescription: "Light and breezy summer dress with floral pattern.",
    description: "Comfortable summer dress made from breathable fabric with beautiful floral design.",
    price: 79.9,
    category: "dresses",
    sizes: ["xs", "s", "m", "l", "xl"],
    colors: ["blue", "pink", "yellow"],
    images: {
      blue: "/products/dresses/floral-blue.png",
      pink: "/products/dresses/floral-pink.png",
      yellow: "/products/dresses/floral-yellow.png",
    },
  },
  {
    id: 12,
    name: "Winter Gloves",
    shortDescription: "Warm and comfortable winter gloves.",
    description: "Insulated winter gloves with touchscreen compatibility and water-resistant material.",
    price: 29.9,
    category: "gloves",
    sizes: ["s", "m", "l"],
    colors: ["black", "gray", "navy"],
    images: {
      black: "/products/gloves/winter-black.png",
      gray: "/products/gloves/winter-gray.png",
      navy: "/products/gloves/winter-navy.png",
    },
  },
];

const ProductList = ({ category,params }: { category: string, params:"homepage" | "products" }) => {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  const sort = searchParams.get("sort");
  const search = searchParams.get("search");

  // Use URL category if available, otherwise use prop category
  const activeCategory = urlCategory || category;

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Category filtering
    if (activeCategory && activeCategory !== 'all') {
      filtered = filtered.filter(product => product.category === activeCategory);
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
          filtered = [...filtered].sort((a, b) => Number(b.id) - Number(a.id));
          break;
        case 'oldest':
          filtered = [...filtered].sort((a, b) => Number(a.id) - Number(b.id));
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [activeCategory, search, sort]);

  return (
    <div className="w-full">
      <Categories />
      {params === "products" && <Filter/>}
      
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
