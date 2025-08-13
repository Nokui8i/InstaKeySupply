'use client';

import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useCart } from './CartContext';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import UserAuthDropdown from './UserAuthModal';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  Bars3Icon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  HeartIcon,
  ShoppingBagIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface Product {
  id: string;
  title: string;
  model?: string;
  sku?: string;
  category?: string;
  description?: string;
  price: string | number;
  images?: string[];
  imageUrl?: string;
}

interface NavBarProps {
  onVehicleFiltersChange?: (filters: { make: string; model: string; yearRange: string }) => void;
  onClearVehicleFilters?: () => void;
  onSidebarToggle?: () => void;
  sidebarOpen?: boolean;
}

export default function NavBar({ onVehicleFiltersChange, onClearVehicleFilters, onSidebarToggle, sidebarOpen }: NavBarProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.length;
  const { user, logout } = useAuth();
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const userIconRef = useRef<HTMLButtonElement>(null);
  const [adminSidebarOpenState, setAdminSidebarOpenState] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Listen for admin sidebar state changes
  useEffect(() => {
    const handleAdminSidebarStateChange = (event: CustomEvent) => {
      setAdminSidebarOpenState(event.detail.sidebarOpen);
    };

    window.addEventListener('admin-sidebar-state-change', handleAdminSidebarStateChange as EventListener);
    return () => {
      window.removeEventListener('admin-sidebar-state-change', handleAdminSidebarStateChange as EventListener);
    };
  }, []);

  // Filter state
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
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
      const q = query(productsRef, orderBy("title"));
      
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

  // Handle search result click
  const handleResultClick = (productId: string) => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    // Navigate to product page
    window.location.href = `/products/${productId}`;
  };

  // Close mobile search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileSearchOpen && !(event.target as Element).closest('.mobile-search-container')) {
        setMobileSearchOpen(false);
        setSearchTerm("");
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileSearchOpen]);

  // Prevent body scroll when mobile search is open
  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.classList.add('mobile-search-open');
    } else {
      document.body.classList.remove('mobile-search-open');
    }

    return () => {
      document.body.classList.remove('mobile-search-open');
    };
  }, [mobileSearchOpen]);

  return (
    <>
      {/* Modern Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Logo Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
                  <Image 
                    src="/Untitled design.png" 
                    alt="InstaKey Logo" 
                    width={80} 
                    height={80}
                    className="object-contain w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
                    priority
                  />
                </Link>
              </div>

              {/* Home Button - Hidden on mobile */}
              <Link 
                href="/" 
                className="hidden sm:block px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200"
              >
                Home
              </Link>

              {/* Sidebar Toggle Button - hide on admin pages */}
              {!pathname.startsWith('/admin') && (
                <button
                  onClick={() => onSidebarToggle?.()}
                  onTouchStart={() => onSidebarToggle?.()}
                  className="mobile-nav-button p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 active:scale-95"
                  aria-label="Menu"
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>
              )}
              
              {pathname.startsWith('/admin') && (
                <button
                  onClick={() => {
                    if ((window as any).lastAdminSidebarClick && Date.now() - (window as any).lastAdminSidebarClick < 100) {
                      console.log('Ignoring rapid admin sidebar click');
                      return;
                    }
                    (window as any).lastAdminSidebarClick = Date.now();
                    window.dispatchEvent(new CustomEvent('admin-sidebar-toggle'));
                  }}
                  onTouchStart={() => {
                    if ((window as any).lastAdminSidebarClick && Date.now() - (window as any).lastAdminSidebarClick < 100) {
                      return;
                    }
                    (window as any).lastAdminSidebarClick = Date.now();
                    window.dispatchEvent(new CustomEvent('admin-sidebar-toggle'));
                  }}
                  className="mobile-nav-button p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 active:scale-95"
                  aria-label="Admin menu"
                >
                  {adminSidebarOpenState ? (
                    <XMarkIcon className="h-5 w-5" />
                  ) : (
                    <Cog6ToothIcon className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for keys, remotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                />
                
                {/* Desktop search results dropdown */}
                {searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 max-h-80 overflow-hidden z-50">
                    <div className="max-h-80 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-6 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                          <p className="mt-3 text-sm font-medium">Searching products...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.slice(0, 6).map((product, index) => (
                            <button
                              key={product.id}
                              onClick={() => handleResultClick(product.id)}
                              className="w-full px-4 py-3 text-left hover:bg-purple-50/80 transition-all duration-200 border-b border-gray-100/50 last:border-b-0 group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-200">
                                  {product.images?.[0] || product.imageUrl ? (
                                    <img src={product.images?.[0] || product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors duration-200">{product.title}</h4>
                                  <p className="text-sm text-gray-600 truncate">{product.model}</p>
                                  <p className="text-sm font-bold text-purple-600 group-hover:text-purple-700 transition-colors duration-200">${product.price}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <p className="text-sm font-medium">No products found</p>
                          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Search & Filter Section */}
            <div className="lg:hidden flex items-center space-x-2 mobile-search-filter-container">
              {/* Mobile Search Bar - Expanded */}
              {mobileSearchOpen && (
                <div className="mobile-search-container mobile-search-expanded absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-3 z-50">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setMobileSearchOpen(false);
                        setSearchTerm("");
                        setSearchResults([]);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Mobile search results */}
                  {searchTerm && (
                    <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-2 text-xs font-medium">Searching...</p>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="py-2">
                            {searchResults.slice(0, 4).map((product, index) => (
                              <button
                                key={product.id}
                                onClick={() => handleResultClick(product.id)}
                                className="w-full px-3 py-2 text-left hover:bg-purple-50/80 transition-all duration-200 border-b border-gray-100/50 last:border-b-0 group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                                    {product.images?.[0] || product.imageUrl ? (
                                      <img src={product.images?.[0] || product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate text-sm">{product.title}</h4>
                                    <p className="text-xs text-gray-600 truncate">{product.model}</p>
                                    <p className="text-xs font-bold text-purple-600">${product.price}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-gray-500">
                            <p className="text-xs font-medium">No products found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Vehicle Filter Dropdown */}
              {filterOpen && (
                <div className="mobile-filter-dropdown absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200/50 backdrop-blur-xl z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Vehicle Filters</h3>
                      <button 
                        onClick={() => setFilterOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Clear All Button */}
                    <div className="mb-3">
                      <button 
                        className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors active:scale-95"
                        onClick={() => {
                          setSelectedMake('');
                          setSelectedModel('');
                          setSelectedYear('');
                          onClearVehicleFilters?.();
                          setFilterOpen(false);
                        }}
                      >
                        Clear All Filters
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <select 
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={selectedMake}
                        onChange={(e) => setSelectedMake(e.target.value)}
                      >
                        <option value="">Select Make</option>
                        {Object.keys(vehicleData).map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                      
                      <select 
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={!selectedMake}
                      >
                        <option value="">Select Model</option>
                        {selectedMake && vehicleData[selectedMake] && Object.keys(vehicleData[selectedMake]).map((model: string) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                      
                      <select 
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        <option value="">Select Year</option>
                        {Array.from({length: 25}, (_, i) => 2024 - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      
                      <button 
                        className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (selectedMake) {
                            onVehicleFiltersChange?.({
                              make: selectedMake,
                              model: selectedModel || '',
                              yearRange: selectedYear || ''
                            });
                            setFilterOpen(false);
                          }
                        }}
                        disabled={!selectedMake}
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              
              {/* Vehicle Selector - Desktop */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200/50 active:scale-95"
                >
                  <GlobeAltIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Vehicle</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                
                {/* Vehicle Dropdown */}
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200/50 backdrop-blur-xl z-50">
                    <div className="p-4">
                      {/* Clear All Button */}
                      <div className="mb-3">
                        <button 
                          className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors active:scale-95"
                          onClick={() => {
                            setSelectedMake('');
                            setSelectedModel('');
                            setSelectedYear('');
                            onClearVehicleFilters?.();
                          }}
                        >
                          Clear All Filters
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select 
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={selectedMake}
                          onChange={(e) => setSelectedMake(e.target.value)}
                        >
                          <option value="">Make</option>
                          {Object.keys(vehicleData).map(make => (
                            <option key={make} value={make}>{make}</option>
                          ))}
                        </select>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                        >
                          <option value="">Model</option>
                          {selectedMake && vehicleData[selectedMake] && Object.keys(vehicleData[selectedMake]).map((model: string) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                        >
                          <option value="">Year</option>
                          {Array.from({length: 25}, (_, i) => 2024 - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <button 
                          className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors active:scale-95"
                          onClick={() => {
                            // Apply filters only when button is clicked
                            if (selectedMake) {
                              onVehicleFiltersChange?.({
                                make: selectedMake,
                                model: selectedModel || '',
                                yearRange: selectedYear || ''
                              });
                              setFilterOpen(false);
                            }
                          }}
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Icons - Desktop Only */}
              <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
                {/* Account */}
                <div className="relative">
                  <button 
                    ref={userIconRef}
                    onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                    onTouchStart={() => setAuthDropdownOpen(!authDropdownOpen)}
                    className="mobile-nav-button p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 group active:scale-95"
                  >
                    <UserIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                  {authDropdownOpen && (
                    <UserAuthDropdown 
                      open={authDropdownOpen} 
                      onClose={() => setAuthDropdownOpen(false)} 
                      anchorRef={userIconRef}
                    />
                  )}
                </div>

                {/* Wishlist */}
                <Link href="/wishlist" className="mobile-nav-button p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-200 group relative active:scale-95">
                  <HeartIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                </Link>

                {/* Cart */}
                <Link href="/cart" className="mobile-nav-button p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group relative active:scale-95">
                  <ShoppingBagIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Mobile Search & Filter Icons - Moved to Right */}
              <div className="lg:hidden flex items-center space-x-2">
                {/* Mobile Search Icon - Click to expand */}
                {!mobileSearchOpen && (
                  <button
                    onClick={() => setMobileSearchOpen(true)}
                    onTouchStart={() => setMobileSearchOpen(true)}
                    className="mobile-nav-button p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 active:scale-95"
                    aria-label="Search"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                )}

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  onTouchStart={() => setFilterOpen(!filterOpen)}
                  className="mobile-nav-button p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 active:scale-95"
                  aria-label="Filters"
                >
                  <FunnelIcon className="h-5 w-5" />
                </button>


              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Vehicle Filter Modal - Hidden for cleaner UI */}
      {/* The dropdown above the Vehicle button still works for vehicle selection */}
    </>
  );
}

