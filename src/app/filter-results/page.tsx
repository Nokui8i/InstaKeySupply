"use client";
import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useSearchParams } from 'next/navigation';
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function FilterResultsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [sortedProducts, setSortedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;
  
  // Get filter parameters from URL
  const make = searchParams.get('make');
  const model = searchParams.get('model');
  const yearRange = searchParams.get('yearRange');

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
        
        // Apply filters if they exist
        if (make || model || yearRange) {
          const filtered = fetchedProducts.filter(product => {
            if (!product.selectedCompatibility || !Array.isArray(product.selectedCompatibility)) {
              return false;
            }
            
            return product.selectedCompatibility.some((compatibility: any) => {
              // If only make is selected, show all products for that make
              if (make && !model && !yearRange) {
                return compatibility.brand === make;
              }
              
              // If make and model are selected, show all products for that make/model
              if (make && model && !yearRange) {
                return compatibility.brand === make && 
                       (compatibility.model === model || compatibility.model === "");
              }
              
              // If all three are selected, show specific products
              if (make && model && yearRange) {
                const yearRangeParts = yearRange.split('-');
                const filterYearStart = parseInt(yearRangeParts[0]);
                const filterYearEnd = parseInt(yearRangeParts[1] || yearRangeParts[0]);
                
                const yearMatches = !compatibility.yearStart || 
                                   (compatibility.yearStart && compatibility.yearEnd &&
                                    filterYearStart <= parseInt(compatibility.yearEnd) && 
                                    filterYearEnd >= parseInt(compatibility.yearStart));
                
                return compatibility.brand === make && 
                       (compatibility.model === model || compatibility.model === "") &&
                       yearMatches;
              }
              
              return false;
            });
          });
          
          setFilteredProducts(filtered);
        } else {
          setFilteredProducts(fetchedProducts);
        }
        
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [make, model, yearRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center animate-pulse">
            <img 
              src="/Untitled design.png" 
              alt="INSTAKEY Logo" 
              className="w-full h-full object-contain"
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600 mb-4">
          {make ? `Filtered Products for: ${make}` : 'All Products'}
        </h1>
        
        
      </div>

             {/* Sort By Dropdown */}
       <div className="flex justify-end mb-6">
         <select
           value={sortBy}
           onChange={(e) => setSortBy(e.target.value)}
           className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-36"
         >
           <option value="name">Sort by Name (A-Z)</option>
           <option value="name-desc">Sort by Name (Z-A)</option>
           <option value="price-low">Sort by Price (Low to High)</option>
           <option value="price-high">Sort by Price (High to Low)</option>
           <option value="sku">Sort by SKU (A-Z)</option>
           <option value="sku-desc">Sort by SKU (Z-A)</option>
         </select>
       </div>

             {/* Products Grid */}
       {currentProducts.length > 0 ? (
         <>
           {/* Products Count */}
           <div className="text-center mb-6">
             <p className="text-gray-600 text-sm md:text-base">
               Showing {startIndex + 1}-{Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
             </p>
           </div>

           {/* Products Grid - Responsive */}
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
             {currentProducts.map((product) => (
               <ProductCard
                 key={product.id}
                 id={product.id}
                 image={product.images?.[0] || product.imageUrl || '/sample-key-1.png'}
                 title={product.title}
                 model={product.model}
                 price={product.price}
                 oldPrice={product.oldPrice}
               />
             ))}
           </div>

           {/* Pagination Controls */}
           {totalPages > 1 && (
             <div className="flex justify-center items-center space-x-2 mt-8">
               <button
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                 disabled={currentPage === 1}
                 className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
               >
                 Previous
               </button>
               
               <span className="px-4 py-2 text-sm text-gray-600">
                 Page {currentPage} of {totalPages}
               </span>
               
               <button
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages}
                 className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
               >
                 Next
               </button>
             </div>
           )}
         </>
       ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            {make 
              ? `No products found for ${make}${model ? ` ${model}` : ''}${yearRange ? ` (${yearRange})` : ''}`
              : 'No products available.'
            }
          </p>
          <a 
            href="/" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            View All Products
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
