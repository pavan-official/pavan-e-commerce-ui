'use client'

import { useSearchStore } from '@/stores/searchStore'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface AdvancedSearchBarProps {
  placeholder?: string
  className?: string
  showFilters?: boolean
}

export default function AdvancedSearchBar({ 
  placeholder = "Search products...", 
  className = "",
  showFilters = true 
}: AdvancedSearchBarProps) {
  const router = useRouter()
  const { 
    suggestions, 
    isSuggestionsLoading, 
    searchSuggestions, 
    setSuggestions,
    recentSearches,
    filters,
    setFilters,
    applyFilters 
  } = useSearchStore()
  
  const [query, setQuery] = useState(filters.q || '')
  const [isOpen, setIsOpen] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchSuggestions(query)
        setIsOpen(true)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, searchSuggestions, setSuggestions])

  const handleSearch = (searchQuery?: string) => {
    const searchTerm = searchQuery || query
    if (searchTerm.trim()) {
      setFilters({ q: searchTerm })
      applyFilters()
      setIsOpen(false)
      router.push(`/products?q=${encodeURIComponent(searchTerm)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'product') {
      router.push(suggestion.url)
    } else if (suggestion.type === 'category') {
      router.push(suggestion.url)
    } else if (suggestion.type === 'term') {
      setQuery(suggestion.title)
      handleSearch(suggestion.title)
    }
    setIsOpen(false)
  }

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery)
    handleSearch(recentQuery)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => {
            if (suggestions.length > 0 || recentSearches.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              title="Advanced filters"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => handleSearch()}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            title="Search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Recent Searches
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(recentQuery)}
                  className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {recentQuery}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isSuggestionsLoading && (
            <div className="px-4 py-2 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-gray-500">Searching...</span>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {!isSuggestionsLoading && suggestions.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left px-2 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  <div className="flex items-center">
                    {suggestion.type === 'product' && (
                      <>
                        {suggestion.image ? (
                          <Image
                            src={suggestion.image}
                            alt={suggestion.title}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded object-cover mr-3"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-xs text-gray-500">
                              {suggestion.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{suggestion.title}</div>
                          <div className="text-xs text-gray-500">{suggestion.subtitle}</div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          ${suggestion.price ? Number(suggestion.price).toFixed(2) : '0.00'}
                        </div>
                      </>
                    )}
                    
                    {suggestion.type === 'category' && (
                      <>
                        <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center mr-3">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{suggestion.title}</div>
                          <div className="text-xs text-gray-500">{suggestion.subtitle}</div>
                        </div>
                      </>
                    )}
                    
                    {suggestion.type === 'term' && (
                      <>
                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3">
                          <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{suggestion.title}</div>
                        </div>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isSuggestionsLoading && query && suggestions.length === 0 && (
            <div className="px-4 py-2 text-center text-sm text-gray-500">
              No suggestions found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
