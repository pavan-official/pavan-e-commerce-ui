"use client";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const SearchBar = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    // Only update URL if we're on the products page
    if (pathname === "/products") {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    
    // Navigate to products page with search query
    router.push(`/products?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className='hidden sm:flex items-center gap-2 rounded-md ring-1 ring-gray-200 px-2 py-1 shadow-md'>
      <Search className="w-4 h-4 text-gray-500"/>
      <input 
        id="search" 
        placeholder="Search..." 
        className="text-sm outline-0"
        value={searchQuery}
        onChange={handleSearch}
      />
    </form>
  )
}

export default SearchBar