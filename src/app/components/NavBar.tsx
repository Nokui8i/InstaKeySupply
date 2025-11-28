'use client';

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useCart } from './CartContext';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import UserAuthDropdown from './UserAuthModal';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.length;
  const { user, logout } = useAuth();
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const userIconRef = useRef<HTMLButtonElement>(null);
  const [adminSidebarOpenState, setAdminSidebarOpenState] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'make' | 'model' | 'year' | null>(null);
  const makeDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const isFilterButtonClick = useRef(false);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const desktopSearchRef = useRef<HTMLFormElement>(null);
  const vehicleFilterRef = useRef<HTMLDivElement>(null);
  const authDropdownRef = useRef<HTMLDivElement>(null);
  
  // Track if component is mounted for portal rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    if (searchTerm.trim()) {
      setShowSearchDropdown(true);
      const timeoutId = setTimeout(() => {
        searchProducts(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setShowSearchDropdown(false);
      setSearchResults([]);
    }
  }, [searchTerm]);

  // Handle search result click
  const handleResultClick = (productId: string) => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchDropdown(false);
    // Navigate to product page
    window.location.href = `/products/${productId}`;
  };

  // Handle search submission (Enter key or search button click)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (searchTerm.trim()) {
      // Close mobile search if open
      setMobileSearchOpen(false);
      // Close dropdown
      setShowSearchDropdown(false);
      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      // Clear search term and results
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  // Close mobile search and filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close desktop search dropdown when clicking outside
      if (showSearchDropdown && desktopSearchRef.current && !desktopSearchRef.current.contains(target)) {
        setShowSearchDropdown(false);
        // Don't clear searchTerm or results, just hide the dropdown
      }
      
      // Close desktop Vehicle filter dropdown when clicking outside
      if (filterOpen && vehicleFilterRef.current && !vehicleFilterRef.current.contains(target)) {
        setFilterOpen(false);
      }
      
      // Close Sign In dropdown when clicking outside
      if (authDropdownOpen) {
        const isClickOnDropdown = target.closest('[class*="animate-scale-in"]') || 
                                   target.closest('.bg-white.rounded-lg.shadow-2xl');
        const isClickOnButton = userIconRef.current && userIconRef.current.contains(target);
        const isClickInContainer = authDropdownRef.current && authDropdownRef.current.contains(target);
        
        if (!isClickOnDropdown && !isClickOnButton && !isClickInContainer) {
          setAuthDropdownOpen(false);
        }
      }
      
      if (mobileSearchOpen && !target.closest('.mobile-search-container')) {
        setMobileSearchOpen(false);
        setSearchTerm("");
        setSearchResults([]);
      }
      
      // Skip if this is a filter button click (handled by button's onClick)
      if (isFilterButtonClick.current) {
        isFilterButtonClick.current = false;
        return;
      }
      
      // Close dropdowns when clicking outside (check this first before closing filter)
      if (openDropdown && 
          !target.closest('.custom-dropdown-trigger') &&
          !target.closest('.custom-dropdown-menu')) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
      
      // Close mobile filter when clicking outside (but not when clicking the filter button itself or dropdowns)
      // IMPORTANT: Check for dropdown menus first since they're portaled to document.body
      const isClickOnDropdown = target.closest('.custom-dropdown-menu');
      const isClickOnDropdownTrigger = target.closest('.custom-dropdown-trigger');
      const isClickInFilter = target.closest('.mobile-filter-container');
      const isClickOnFilterButton = filterButtonRef.current && filterButtonRef.current.contains(target as Node);
      
      if (mobileFilterOpen && 
          !isClickOnDropdown &&
          !isClickOnDropdownTrigger &&
          !isClickInFilter &&
          !isClickOnFilterButton) {
        setMobileFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileSearchOpen, mobileFilterOpen, openDropdown, searchTerm, filterOpen, authDropdownOpen]);

  // Prevent body scroll when mobile search or filter is open
  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.classList.add('mobile-search-open');
      document.body.classList.remove('mobile-filter-open');
    } else if (mobileFilterOpen) {
      document.body.classList.add('mobile-filter-open');
      document.body.classList.remove('mobile-search-open');
    } else {
      document.body.classList.remove('mobile-search-open');
      document.body.classList.remove('mobile-filter-open');
    }

    return () => {
      document.body.classList.remove('mobile-search-open');
      document.body.classList.remove('mobile-filter-open');
    };
  }, [mobileSearchOpen, mobileFilterOpen]);

  // Calculate dropdown position dynamically for mobile filter
  useEffect(() => {
    if (!openDropdown || !mobileFilterOpen) {
      setDropdownPosition(null);
      return;
    }

    const calculatePosition = () => {
      let ref: React.RefObject<HTMLDivElement> | null = null;
      if (openDropdown === 'make') ref = makeDropdownRef;
      else if (openDropdown === 'model') ref = modelDropdownRef;
      else if (openDropdown === 'year') ref = yearDropdownRef;

      if (ref?.current) {
        const rect = ref.current.getBoundingClientRect();
        const buttonRect = ref.current.querySelector('.custom-dropdown-trigger')?.getBoundingClientRect();
        if (buttonRect) {
          setDropdownPosition({
            top: buttonRect.bottom + 4,
            left: buttonRect.left,
            width: buttonRect.width
          });
        }
      }
    };

    // Calculate on mount and window resize
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [openDropdown, mobileFilterOpen]);

  return (
    <>
      {/* Modern Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 relative">
            
            {/* Logo Section - Desktop shows normally, Mobile has centered logo */}
            <div className="flex items-center space-x-2 sm:space-x-4 lg:relative">
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

              {/* Cart Icon - Mobile only, next to sidebar button */}
              <Link 
                href="/cart" 
                className="lg:hidden mobile-nav-button p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group relative active:scale-95"
              >
                <ShoppingBagIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Logo - Centered on mobile only, normal position on desktop */}
              <div className="lg:flex lg:items-center lg:static absolute left-1/2 lg:left-auto transform lg:transform-none -translate-x-1/2 lg:translate-x-0">
                <button 
                  onClick={() => {
                    // Clear vehicle filters when logo is clicked
                    setSelectedMake('');
                    setSelectedModel('');
                    setSelectedYear('');
                    onClearVehicleFilters?.();
                    // Also navigate to home
                    router.push('/');
                  }}
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <Image 
                    src="/Untitled design.png" 
                    alt="InstaKey Logo" 
                    width={170} 
                    height={170}
                    className="object-contain w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40"
                    priority
                  />
                </button>
              </div>

              {/* Home Button - Hidden on mobile */}
              <Link 
                href="/" 
                className="hidden sm:block px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200"
              >
                Home
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <form ref={desktopSearchRef} onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for keys, remotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit(e);
                    }
                  }}
                  className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                />
                <button
                  type="submit"
                  onClick={handleSearchSubmit}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
                
                {/* Desktop search results dropdown */}
                {showSearchDropdown && searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 max-h-80 overflow-hidden z-50">
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
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                            <button
                              onClick={handleSearchSubmit}
                              className="w-full px-4 py-3 text-center text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100/50 font-medium transition-colors"
                            >
                              View all {searchResults.length} results →
                            </button>
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
              </form>
            </div>

            {/* Mobile Search & Filter Section */}
            <div className="lg:hidden flex items-center space-x-2 mobile-search-filter-container">
              {/* Mobile Search Bar - Expanded */}
              {mobileSearchOpen && (
                <div className="mobile-search-container mobile-search-expanded absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-3 z-50">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchSubmit(e);
                        }
                      }}
                      className="block w-full pl-3 pr-20 py-2 border border-gray-300 rounded-lg bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      autoFocus
                    />
                    <button
                      type="submit"
                      onClick={handleSearchSubmit}
                      className="absolute inset-y-0 right-10 pr-2 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label="Search"
                    >
                      <MagnifyingGlassIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileSearchOpen(false);
                        setSearchTerm("");
                        setSearchResults([]);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </form>
                  
                  {/* Mobile search results */}
                  {searchTerm && (
                    <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-xs font-medium">Searching...</p>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="py-2">
                            {searchResults.slice(0, 4).map((product, index) => (
                              <button
                                key={product.id}
                                onClick={() => handleResultClick(product.id)}
                                className="w-full px-3 py-2 text-left hover:bg-blue-50/80 transition-all duration-200 border-b border-gray-100/50 last:border-b-0 group"
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
                                    <p className="text-xs font-bold text-blue-600">${product.price}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                            {searchResults.length > 4 && (
                              <button
                                onClick={handleSearchSubmit}
                                className="w-full px-3 py-2 text-center text-xs text-blue-600 hover:bg-blue-50 border-t border-gray-100/50 font-medium transition-colors"
                              >
                                View all {searchResults.length} results →
                              </button>
                            )}
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

              {/* Mobile Filter Collapsible Sub-Header */}
              {mobileFilterOpen && (
                <div className="mobile-filter-container mobile-filter-expanded absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-2.5 z-50">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">Vehicle Filters</h3>
                    <button 
                      onClick={() => {
                        setMobileFilterOpen(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-1.5">
                    {/* Make Dropdown */}
                    <div className="relative" ref={makeDropdownRef}>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Make</label>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'make' ? null : 'make')}
                        disabled={loadingVehicleData}
                        className="custom-dropdown-trigger w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={selectedMake ? 'text-gray-900' : 'text-gray-500'}>
                          {loadingVehicleData ? 'Loading...' : selectedMake || 'Select Make'}
                        </span>
                        <svg className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'make' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === 'make' && (
                        isMounted && typeof window !== 'undefined' && window.innerWidth <= 1024 && dropdownPosition ? (
                          createPortal(
                            <div 
                              className="custom-dropdown-menu bg-white border border-gray-300 rounded-md shadow-lg z-[10001] max-h-64 overflow-y-auto"
                              style={{
                                position: 'fixed',
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`,
                                width: `${dropdownPosition.width}px`
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMake('');
                                  setOpenDropdown(null);
                                  setDropdownPosition(null);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${!selectedMake ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`}
                              >
                                Select Make
                              </button>
                              {!loadingVehicleData && Object.keys(vehicleData).map(make => (
                                <button
                                  key={make}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMake(make);
                                    setSelectedModel('');
                                    setSelectedYear('');
                                    setOpenDropdown(null);
                                    setDropdownPosition(null);
                                  }}
                                  className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${selectedMake === make ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}`}
                                >
                                  {make}
                                </button>
                              ))}
                            </div>,
                            document.body
                          )
                        ) : (
                          <div 
                            className="custom-dropdown-menu bg-white border border-gray-300 rounded-md shadow-lg z-[10001] max-h-64 overflow-y-auto"
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              marginTop: '4px'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMake('');
                                setOpenDropdown(null);
                              }}
                              className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${!selectedMake ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`}
                            >
                              Select Make
                            </button>
                            {!loadingVehicleData && Object.keys(vehicleData).map(make => (
                              <button
                                key={make}
                                type="button"
                                onClick={() => {
                                  setSelectedMake(make);
                                  setSelectedModel('');
                                  setSelectedYear('');
                                  setOpenDropdown(null);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${selectedMake === make ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}`}
                              >
                                {make}
                              </button>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                    
                    {/* Model Dropdown */}
                    <div className="relative" ref={modelDropdownRef}>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Model</label>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'model' ? null : 'model')}
                        disabled={!selectedMake}
                        className="custom-dropdown-trigger w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={selectedModel ? 'text-gray-900' : 'text-gray-500'}>
                          {selectedModel || 'Select Model'}
                        </span>
                        <svg className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'model' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === 'model' && selectedMake && vehicleData[selectedMake] && (
                        isMounted && typeof window !== 'undefined' && window.innerWidth <= 1024 && dropdownPosition ? (
                          createPortal(
                            <div 
                              className="custom-dropdown-menu bg-white border border-gray-300 rounded-md shadow-lg z-[10001] max-h-64 overflow-y-auto"
                              style={{
                                position: 'fixed',
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`,
                                width: `${dropdownPosition.width}px`
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedModel('');
                                  setSelectedYear('');
                                  setOpenDropdown(null);
                                  setDropdownPosition(null);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${!selectedModel ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`}
                              >
                                Select Model
                              </button>
                              {Object.keys(vehicleData[selectedMake]).map((model: string) => (
                                <button
                                  key={model}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModel(model);
                                    setSelectedYear('');
                                    setOpenDropdown(null);
                                    setDropdownPosition(null);
                                  }}
                                  className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${selectedModel === model ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}`}
                                >
                                  {model}
                                </button>
                              ))}
                            </div>,
                            document.body
                          )
                        ) : (
                          <div 
                            className="custom-dropdown-menu bg-white border border-gray-300 rounded-md shadow-lg z-[10001] max-h-64 overflow-y-auto"
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              marginTop: '4px'
                            }}
                          >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModel('');
                              setSelectedYear('');
                              setOpenDropdown(null);
                            }}
                            className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${!selectedModel ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`}
                          >
                            Select Model
                          </button>
                          {Object.keys(vehicleData[selectedMake]).map((model: string) => (
                            <button
                              key={model}
                              type="button"
                              onClick={() => {
                                setSelectedModel(model);
                                setSelectedYear('');
                                setOpenDropdown(null);
                              }}
                              className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${selectedModel === model ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}`}
                            >
                              {model}
                            </button>
                          ))}
                          </div>
                        )
                      )}
                    </div>
                    
                    {/* Year Range Dropdown */}
                    <div className="relative" ref={yearDropdownRef}>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Year Range</label>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
                        disabled={!selectedMake || !selectedModel}
                        className="custom-dropdown-trigger w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={selectedYear ? 'text-gray-900' : 'text-gray-500'}>
                          {selectedYear || 'Select Year Range'}
                        </span>
                        <svg className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'year' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === 'year' && selectedMake && selectedModel && vehicleData[selectedMake] && vehicleData[selectedMake][selectedModel] && (
                        isMounted && typeof window !== 'undefined' && window.innerWidth <= 1024 && dropdownPosition ? (
                          createPortal(
                            <div 
                              className="custom-dropdown-menu bg-white border border-gray-300 rounded-md shadow-lg z-[10001] max-h-64 overflow-y-auto"
                              style={{
                                position: 'fixed',
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`,
                                width: `${dropdownPosition.width}px`
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedYear('');
                                  setOpenDropdown(null);
                                  setDropdownPosition(null);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${!selectedYear ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`}
                              >
                                Select Year Range
                              </button>
                              {vehicleData[selectedMake][selectedModel].length > 0 ? (
                                vehicleData[selectedMake][selectedModel].map((yearRange: string) => (
                                  <button
                                    key={yearRange}
                                    type="button"
                                    onClick={() => {
                                      setSelectedYear(yearRange);
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                      // Auto-apply filters when year is selected
                                      if (selectedMake) {
                                        const params = new URLSearchParams();
                                        params.set('make', selectedMake);
                                        if (selectedModel) params.set('model', selectedModel);
                                        params.set('yearRange', yearRange);
                                        window.location.href = `/filter-results?${params.toString()}`;
                                        setMobileFilterOpen(false);
                                      }
                                    }}
                                    className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${selectedYear === yearRange ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}`}
                                  >
                                    {yearRange}
                                  </button>
                                ))
                              ) : (
                                <div className="px-2.5 py-1.5 text-xs text-gray-500">No year ranges available</div>
                              )}
                            </div>,
                            document.body
                          )
                        ) : (
                          <div 
                            className="custom-dropdown-menu bg-white border border-gray-300 rounded-md shadow-lg z-[10001] max-h-64 overflow-y-auto"
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              marginTop: '4px'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedYear('');
                                setOpenDropdown(null);
                              }}
                              className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${!selectedYear ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`}
                            >
                              Select Year Range
                            </button>
                            {vehicleData[selectedMake][selectedModel].length > 0 ? (
                              vehicleData[selectedMake][selectedModel].map((yearRange: string) => (
                                <button
                                  key={yearRange}
                                  type="button"
                                  onClick={() => {
                                    setSelectedYear(yearRange);
                                    setOpenDropdown(null);
                                    // Auto-apply filters when year is selected
                                    if (selectedMake) {
                                      const params = new URLSearchParams();
                                      params.set('make', selectedMake);
                                      if (selectedModel) params.set('model', selectedModel);
                                      params.set('yearRange', yearRange);
                                      window.location.href = `/filter-results?${params.toString()}`;
                                      setMobileFilterOpen(false);
                                    }
                                  }}
                                  className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 ${selectedYear === yearRange ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'}`}
                                >
                                  {yearRange}
                                </button>
                              ))
                            ) : (
                              <div className="px-2.5 py-1.5 text-xs text-gray-500">No year ranges available</div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                    
                    <div className="flex gap-1.5 pt-1 justify-center items-center">
                      <button 
                        className="apply-filters-button"
                        onClick={() => {
                          if (selectedMake) {
                            // Build URL for filter results page
                            const params = new URLSearchParams();
                            params.set('make', selectedMake);
                            if (selectedModel) params.set('model', selectedModel);
                            if (selectedYear) params.set('yearRange', selectedYear);
                            
                            // Navigate to filter results page
                            window.location.href = `/filter-results?${params.toString()}`;
                            setMobileFilterOpen(false);
                          }
                        }}
                        disabled={!selectedMake}
                      >
                        Apply Filters
                      </button>
                      <button 
                        className="clear-filters-button"
                        onClick={() => {
                          setSelectedMake('');
                          setSelectedModel('');
                          setSelectedYear('');
                          if (onClearVehicleFilters) {
                            onClearVehicleFilters();
                          }
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              
              {/* Vehicle Selector - Desktop */}
              <div className="relative hidden md:block" ref={vehicleFilterRef}>
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
                      <div className="grid grid-cols-2 gap-3">
                                              <select 
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedMake}
                        onChange={(e) => setSelectedMake(e.target.value)}
                        disabled={loadingVehicleData}
                      >
                        <option value="">{loadingVehicleData ? 'Loading...' : 'Make'}</option>
                        {!loadingVehicleData && Object.keys(vehicleData).map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                        >
                          <option value="">Model</option>
                          {selectedMake && vehicleData[selectedMake] && Object.keys(vehicleData[selectedMake]).map((model: string) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                                              <select 
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        disabled={!selectedMake || !selectedModel}
                      >
                        <option value="">Year Range</option>
                        {selectedMake && selectedModel && vehicleData[selectedMake] && vehicleData[selectedMake][selectedModel] && vehicleData[selectedMake][selectedModel].length > 0 ? (
                          vehicleData[selectedMake][selectedModel].map((yearRange: string) => (
                            <option key={yearRange} value={yearRange}>{yearRange}</option>
                          ))
                        ) : selectedMake && selectedModel ? (
                          <option value="" disabled>No year ranges available</option>
                        ) : null}
                      </select>
                        <button 
                          className="apply-filters-button w-full"
                          onClick={() => {
                            // Apply filters only when button is clicked
                            if (selectedMake) {
                              // Build URL for filter results page
                              const params = new URLSearchParams();
                              params.set('make', selectedMake);
                              if (selectedModel) params.set('model', selectedModel);
                              if (selectedYear) params.set('yearRange', selectedYear);
                              
                              // Navigate to filter results page
                              window.location.href = `/filter-results?${params.toString()}`;
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
                <div className="relative" ref={authDropdownRef}>
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
                <button
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  onTouchStart={() => setMobileSearchOpen(!mobileSearchOpen)}
                  className={`mobile-nav-button p-2 rounded-xl transition-all duration-200 active:scale-95 ${
                    mobileSearchOpen 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>

                {/* Mobile Filter Button */}
                <button
                  ref={filterButtonRef}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Set flag immediately to prevent click-outside handler from interfering
                    isFilterButtonClick.current = true;
                    // Toggle the state immediately
                    setMobileFilterOpen((prev) => {
                      const newValue = !prev;
                      return newValue;
                    });
                    if (mobileSearchOpen) {
                      setMobileSearchOpen(false);
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Set flag immediately to prevent click-outside handler from interfering
                    isFilterButtonClick.current = true;
                    // Toggle the state immediately
                    setMobileFilterOpen((prev) => {
                      const newValue = !prev;
                      return newValue;
                    });
                    if (mobileSearchOpen) {
                      setMobileSearchOpen(false);
                    }
                  }}
                  className={`mobile-filter-button mobile-nav-button p-2 rounded-xl transition-all duration-200 active:scale-95 ${
                    mobileFilterOpen 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
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

