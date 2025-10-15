"use client";

import { useCartStore } from "@/stores/cartStore";
import { ProductType } from "@/types";
import { ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const ProductCard = ({ product }: { product: ProductType }) => {
  const [productTypes, setProductTypes] = useState({
    size: product.sizes?.[0] || 'M',
    color: product.colors?.[0] || 'default',
  });

  const { _data: session } = useSession();
  const _router = useRouter();
  const { addToCart } = useCartStore();

  const handleProductType = ({
    type,
    value,
  }: {
    type: "size" | "color";
    value: string;
  }) => {
    setProductTypes((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleAddToCart = async () => {
    if (!session) {
      _router.push('/auth/signin');
      return;
    }

    try {
      await addToCart(product.id.toString(), undefined, 1);
      toast.success("Product added to cart");
    } catch (_error) {
      toast._error("Failed to add product to cart");
    }
  };

  const getProductImage = () => {
    // Handle array of images
    if (Array.isArray(product.images)) {
      return product.images[0] || "/products/placeholder.png";
    }
    
    // Handle object of images
    if (product.images && typeof product.images === 'object') {
      const imageUrl = product.images[productTypes.color] || 
                      product.images.default || 
                      Object.values(product.images)[0];
      return imageUrl || "/products/placeholder.png";
    }
    
    // Fallback to placeholder
    return "/products/placeholder.png";
  };

  return (
    <div className="shadow-lg rounded-lg overflow-hidden">
      {/* IMAGE */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[2/3]">
          <Image
            src={getProductImage()}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-all duration-300"
          />
        </div>
      </Link>
      {/* PRODUCT DETAIL */}
      <div className="flex flex-col gap-4 p-4">
        <h1 className="font-medium">{product.name}</h1>
        <p className="text-sm text-gray-500">{product.shortDescription}</p>
        {/* PRODUCT TYPES */}
        {(product.sizes || product.colors) && (
          <div className="flex items-center gap-4 text-xs">
            {/* SIZES */}
            {product.sizes && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">Size</span>
                <select
                  name="size"
                  id="size"
                  className="ring ring-gray-300 rounded-md px-2 py-1"
                  onChange={(e) =>
                    handleProductType({ type: "size", value: e.target.value })
                  }
                >
                  {product.sizes.map((size) => (
                    <option key={size} value={size}>
                      {size.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* COLORS */}
            {product.colors && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">Color</span>
                <div className="flex items-center gap-2">
                  {product.colors.map((color) => (
                    <div
                      className={`cursor-pointer border-1 ${
                        productTypes.color === color
                          ? "border-gray-400"
                          : "border-gray-200"
                      } rounded-full p-[1.2px]`}
                      key={color}
                      onClick={() =>
                        handleProductType({ type: "color", value: color })
                      }
                    >
                      <div
                        className="w-[14px] h-[14px] rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* PRICE AND ADD TO CART BUTTON */}
        <div className="flex items-center justify-between">
          <p className="font-medium">${Number(product.price).toFixed(2)}</p>
          <button
            onClick={handleAddToCart}
            className="ring-1 ring-gray-200 shadow-lg rounded-md px-2 py-1 text-sm cursor-pointer hover:text-white hover:bg-black transition-all duration-300 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
