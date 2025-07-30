"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from './CartContext';
import Link from 'next/link';
import { UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from './AuthContext';
import UserAuthDropdown from './UserAuthModal';
import { HeartIcon } from '@heroicons/react/24/outline';

interface Product {
  id: string;
  title: string;
  model: string;
  price: string;
  oldPrice?: string;
  imageUrl: string;
  images?: string[];
  category?: string;
  description?: string;
  sku?: string;
}

interface NavBarProps {
  // Removed filter props
}

export default function NavBar({}: NavBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const { user, logout } = useAuth();
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const userIconRef = useRef<HTMLButtonElement>(null);

  // Filter state
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  // Add dynamic vehicle data state
  const [vehicleData, setVehicleData] = useState<any>({});
  const [loadingVehicleData, setLoadingVehicleData] = useState(true);

  useEffect(() => {
    async function fetchVehicleData() {
      setLoadingVehicleData(true);
      try {
        const res = await fetch('/api/vehicle-compatibility/makes-models');
        const json = await res.json();
        setVehicleData(json);
      } catch (e) {
        setVehicleData({});
      }
      setLoadingVehicleData(false);
    }
    fetchVehicleData();
  }, []);

  // Search products function
  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        orderBy("title")
      );
      
      const querySnapshot = await getDocs(q);
      const allProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Filter products based on search term
      const filtered = allProducts.filter(product => {
        const searchLower = term.toLowerCase();
        return (
          product.title?.toLowerCase().includes(searchLower) ||
          product.model?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        );
      });

      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchClick = () => {
    console.log('Search button clicked!'); // Debug log
    setSearchOpen(true);
    // Focus on search input when modal opens
    setTimeout(() => {
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.focus();
    }, 100);
  };

  const handleResultClick = (productId: string) => {
    setSearchOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    // Navigate to product page
    window.location.href = `/products/${productId}`;
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-gradient-to-br from-[#101624]/80 via-[#181f2b]/80 to-[#232a36]/80 backdrop-blur-2xl border-b border-blue-900/40 shadow-2xl transition-all duration-500">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between px-3 sm:px-4 py-2 sm:py-1 gap-3 sm:gap-6 rounded-xl text-center relative">
          {/* Logo (always visible, left) */}
          <a href="/" className="flex items-center gap-2 drop-shadow-xl shrink-0 z-10 relative" style={{marginLeft: '-8px'}}>
            {/* Mobile logo */}
            <span className="relative flex items-center justify-center md:hidden" style={{position: 'absolute', top: '-12px', left: 0, height: '64px', width: '96px'}}>
              <Image src="/Untitled design.png" alt="InstaKey Logo" width={96} height={96} className="object-contain" priority />
            </span>
            {/* Desktop logo (larger) */}
            <span className="relative hidden md:flex items-center justify-center" style={{position: 'absolute', top: '-100px', left: '-300px', height: '260px', width: '340px'}}>
              <Image src="/Untitled design.png" alt="InstaKey Logo" width={260} height={260} className="object-contain" priority />
            </span>
          </a>
          {/* Centered search and filter */}
          <div className="flex-1 flex items-center justify-center gap-3">
            {/* Search Bar (smaller) */}
            <div className="w-full max-w-xs flex justify-center relative">
              <input 
                type="search" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-blue-900/30 bg-white/70 text-gray-900 px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-blue-400/70 transition-all duration-200 shadow-inner placeholder-gray-500 text-base font-medium" 
              />
              {/* Desktop search results dropdown */}
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 max-h-80 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-6 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-3 text-sm font-medium">Searching products...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.slice(0, 6).map((product, index) => (
                          <button
                            key={product.id}
                            onClick={() => handleResultClick(product.id)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50/80 transition-all duration-200 border-b border-gray-100/50 last:border-b-0 group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-200">
                                {product.images?.[0] || product.imageUrl ? (
                                  <img src={product.images?.[0] || product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                                ) : (
                                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-200">{product.title}</h4>
                                <p className="text-sm text-gray-600 truncate">{product.model}</p>
                                <p className="text-sm font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-200">${product.price}</p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </button>
                        ))}
                        {searchResults.length > 6 && (
                          <div className="px-4 py-3 text-center text-sm text-gray-500 border-t border-gray-100/50">
                            +{searchResults.length - 6} more results
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                        </svg>
                        <p className="font-medium">No products found</p>
                        <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Filter fields */}
            <div className="flex gap-2 items-center">
              <select
                className="bg-white rounded-md px-3 py-2 text-gray-700 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={selectedMake}
                onChange={e => {
                  setSelectedMake(e.target.value);
                  setSelectedModel('');
                  setSelectedYear('');
                }}
              >
                <option value="">Make</option>
                {Object.keys(vehicleData).map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
              <select
                className="bg-white rounded-md px-3 py-2 text-gray-700 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={selectedModel}
                onChange={e => {
                  setSelectedModel(e.target.value);
                  setSelectedYear('');
                }}
                disabled={!selectedMake}
              >
                <option value="">Model</option>
                {selectedMake && vehicleData[selectedMake] && Object.keys(vehicleData[selectedMake]).map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              {/* Year/Range Dropdown - always dynamic */}
              <select
                className="bg-white rounded-md px-3 py-2 text-gray-700 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                disabled={!selectedModel}
              >
                <option value="">Please Select</option>
                {selectedMake && selectedModel && vehicleData[selectedMake] && vehicleData[selectedMake][selectedModel] && vehicleData[selectedMake][selectedModel].map((yearRange: string) => (
                  <option key={yearRange} value={yearRange}>{yearRange}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Cart icon always at far right */}
          <div className="flex items-center gap-4 ml-auto">
            {/* User/account icon */}
            <div className="relative">
              <button ref={userIconRef} onClick={() => setAuthDropdownOpen(v => !v)} className="relative group focus:outline-none">
                <UserIcon className="w-7 h-7 text-white hover:text-blue-300 transition" />
              </button>
              <UserAuthDropdown open={authDropdownOpen} onClose={() => setAuthDropdownOpen(false)} anchorRef={userIconRef} />
            </div>
            {/* Wishlist icon (only if logged in) */}
            {user && (
              <Link href="/wishlist" className="relative group">
                <HeartIcon className="w-7 h-7 text-pink-500 hover:text-pink-600 transition" />
              </Link>
            )}
            {/* Cart icon */}
            <Link href="/cart" className="relative group">
              <ShoppingCartIcon className="w-7 h-7 text-white hover:text-blue-300 transition" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Search Modal */}
      {searchOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSearchOpen(false);
              setSearchTerm("");
              setSearchResults([]);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <input
                    id="search-input"
                    type="search"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-full border border-gray-300 bg-gray-50 text-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {isSearching ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-3">Searching products...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleResultClick(product.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          {product.images?.[0] || product.imageUrl ? (
                            <img src={product.images?.[0] || product.imageUrl} alt={product.title} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{product.title}</h4>
                          <p className="text-sm text-gray-600 truncate">{product.model}</p>
                          <p className="text-sm font-medium text-blue-600">${product.price}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                  <p>No products found for "{searchTerm}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                  <p>Search for products</p>
                  <p className="text-sm text-gray-400 mt-1">Enter keywords to find what you're looking for</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 