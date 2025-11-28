"use client";
import React, { useEffect, useState, Suspense } from "react";
import ProductCard from "../components/ProductCard";
import { useSearchParams } from 'next/navigation';
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Image from 'next/image';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [sortedProducts, setSortedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;
  
  // Get search term from URL
  const searchTerm = searchParams.get('q') || '';

  // Sort products based on selected criteria
  useEffect(() => {
    if (filteredProducts.length === 0) {
      setSortedProducts([]);
      return;
    }

    const sorted = [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        case 'name-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'price-low':
          const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.-]+/g, '')) : (a.price || 0);
          const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.-]+/g, '')) : (b.price || 0);
          return priceA - priceB;
        case 'price-high':
          const priceC = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.-]+/g, '')) : (a.price || 0);
          const priceD = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.-]+/g, '')) : (b.price || 0);
          return priceD - priceC;
        case 'sku':
          return (a.sku || '').localeCompare(b.sku || '');
        case 'sku-desc':
          return (b.sku || '').localeCompare(a.sku || '');
        default:
          return 0;
      }
    });

    setSortedProducts(sorted);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, [filteredProducts, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all products
        const productsQuery = query(collection(db, "products"), orderBy("title"));
        const productsSnap = await getDocs(productsQuery);
        const fetchedProducts = productsSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProducts(fetchedProducts);
        
        // Apply search filter if search term exists
        if (searchTerm && searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase().trim();
          const filtered = fetchedProducts.filter(product => {
            return (
              product.title?.toLowerCase().includes(searchLower) ||
              product.model?.toLowerCase().includes(searchLower) ||
              product.sku?.toLowerCase().includes(searchLower) ||
              product.category?.toLowerCase().includes(searchLower) ||
              product.description?.toLowerCase().includes(searchLower) ||
              product.partNumber?.toLowerCase().includes(searchLower) ||
              product.manufacturer?.toLowerCase().includes(searchLower)
            );
          });
          
          setFilteredProducts(filtered);
        } else {
          setFilteredProducts([]);
        }
        
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 flex items-center justify-center animate-pulse">
            <Image 
              src="/Untitled design.png" 
              alt="INSTAKEY Logo" 
              width={128}
              height={128}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-3 sm:mb-4">
          {searchTerm ? `Search Results for: "${searchTerm}"` : 'Search Products'}
        </h1>
        {searchTerm && filteredProducts.length > 0 && (
          <p className="text-gray-600 text-sm md:text-base">
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Sort By Dropdown */}
      {filteredProducts.length > 0 && (
        <div className="flex justify-end mb-4 sm:mb-6">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-28 sm:w-36"
          >
            <option value="name">Sort by Name (A-Z)</option>
            <option value="name-desc">Sort by Name (Z-A)</option>
            <option value="price-low">Sort by Price (Low to High)</option>
            <option value="price-high">Sort by Price (High to Low)</option>
            <option value="sku">Sort by SKU (A-Z)</option>
            <option value="sku-desc">Sort by SKU (Z-A)</option>
          </select>
        </div>
      )}

      {/* Products Grid */}
      {!searchTerm ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Please enter a search term to find products.</p>
          <a 
            href="/" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Home
          </a>
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          {/* Products Count */}
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm md:text-base">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Products Grid - Responsive */}
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6 px-2 sm:px-0 w-full max-w-full overflow-x-hidden">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.images?.[0] || product.imageUrl || '/sample-key-1.png'}
                title={product.title}
                model={product.model}
                price={product.price}
                oldPrice={product.oldPrice}
                isOem={product.isOem}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-2 mt-6 sm:mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600 text-center">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            No products found for "{searchTerm}"
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Try searching with different keywords or check your spelling.
          </p>
          <a 
            href="/" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Home
          </a>
        </div>
      )}

      {/* Back to Home */}
      <div className="text-center mt-12">
        <a 
          href="/" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

