"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import ProductCard from "../../components/ProductCard";

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params?.id as string;
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [sortedProducts, setSortedProducts] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleFilters, setVehicleFilters] = useState<{
    make: string;
    model: string;
    yearRange: string;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // First, try to find the category in the categories collection
        const categoriesQuery = query(collection(db, "categories"), orderBy("createdAt", "desc"));
        const categoriesSnap = await getDocs(categoriesQuery);
        const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        // Try to find category by ID first, then by name
        const decodedCategoryId = decodeURIComponent(categoryId);
        let foundCategory = categories.find((cat: any) => cat.id === decodedCategoryId);
        
        if (!foundCategory) {
          foundCategory = categories.find((cat: any) => cat.name === decodedCategoryId);
        }
        
        if (!foundCategory) {
          // If no category found in collection, create a temporary one
          foundCategory = { id: decodedCategoryId, name: decodedCategoryId };
        }
        
        setCategory(foundCategory);

        // Fetch products for this category
        const productsQuery = query(collection(db, "products"), orderBy("title"));
        const productsSnap = await getDocs(productsQuery);
        const allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        // Filter products by categoryId first, then by category name
        let filtered = allProducts.filter((product: any) => {
          return product.categoryId === foundCategory.id || 
                 product.category === foundCategory.name ||
                 product.category === decodedCategoryId;
        });
        
        // Get the actual category name from the first product found
        let actualCategoryName = foundCategory.name;
        if (filtered.length > 0) {
          // Prefer category name from products, but fall back to found category
          actualCategoryName = filtered[0].category || foundCategory.name;
        }
        
        // Update category with the actual name
        setCategory({ ...foundCategory, name: actualCategoryName });

        // If no products from Firebase, use sample products for testing
        if (filtered.length === 0) {
          console.log('No products from Firebase for category:', categoryId, 'using sample products');
          const sampleProducts = [
            {
              id: "sample-1",
              imageUrl: "/sample-key-1.png",
              title: "Toyota Camry Transponder Key",
              model: "TOY-4D60",
              price: "$89.99",
              oldPrice: "$129.99",
              category: "Car Keys",
              vehicleType: "Car",
              description: "High-quality transponder key for Toyota Camry models",
              selectedCompatibility: [
                {
                  vehicleType: "Car",
                  brand: "Toyota",
                  model: "Camry",
                  yearStart: "2012",
                  yearEnd: "2024",
                  keyTypes: ["Transponder Key", "Remote Key"]
                }
              ]
            },
            {
              id: "sample-2", 
              imageUrl: "/sample-key-2.png",
              title: "Honda Accord Remote Key",
              model: "HON-72MHz",
              price: "$79.95",
              category: "Car Keys",
              vehicleType: "Car",
              description: "Remote key fob for Honda Accord with keyless entry",
              selectedCompatibility: [
                {
                  vehicleType: "Car",
                  brand: "Honda",
                  model: "Accord",
                  yearStart: "2010",
                  yearEnd: "2024",
                  keyTypes: ["Remote Key", "Smart Key"]
                }
              ]
            },
            {
              id: "sample-3",
              imageUrl: "/sample-key-3.png", 
              title: "BMW 3-Series Smart Key",
              model: "BMW-868MHz",
              price: "$199.99",
              oldPrice: "$249.99",
              category: "Car Keys",
              vehicleType: "Car",
              description: "Advanced smart key for BMW 3-Series with comfort access",
              selectedCompatibility: [
                {
                  vehicleType: "Car",
                  brand: "BMW",
                  model: "3-Series",
                  yearStart: "2015",
                  yearEnd: "2024",
                  keyTypes: ["Smart Key", "Proximity Key"]
                }
              ]
            },
            {
              id: "sample-4",
              imageUrl: "/sample-key-4.png",
              title: "Ford F-150 Remote Key",
              model: "FORD-315MHz",
              price: "$69.99",
              category: "Car Keys",
              vehicleType: "Truck",
              description: "Remote key for Ford F-150 pickup trucks",
              selectedCompatibility: [
                {
                  vehicleType: "Truck",
                  brand: "Ford",
                  model: "F-150",
                  yearStart: "2009",
                  yearEnd: "2024",
                  keyTypes: ["Remote Key", "Transponder Key"]
                }
              ]
            },
            {
              id: "sample-5",
              imageUrl: "/sample-key-5.png",
              title: "Chevrolet Silverado Key",
              model: "CHEV-433MHz",
              price: "$59.95",
              category: "Car Keys",
              vehicleType: "Truck",
              description: "Standard key for Chevrolet Silverado models",
              selectedCompatibility: [
                {
                  vehicleType: "Truck",
                  brand: "Chevrolet",
                  model: "Silverado",
                  yearStart: "2007",
                  yearEnd: "2024",
                  keyTypes: ["Transponder Key", "Remote Key"]
                }
              ]
            },
            {
              id: "sample-6",
              imageUrl: "/sample-key-6.png",
              title: "Nissan Altima Smart Key",
              model: "NISS-434MHz",
              price: "$149.99",
              category: "Car Keys",
              vehicleType: "Car",
              description: "Smart key system for Nissan Altima with push-button start",
              selectedCompatibility: [
                {
                  vehicleType: "Car",
                  brand: "Nissan",
                  model: "Altima",
                  yearStart: "2013",
                  yearEnd: "2024",
                  keyTypes: ["Smart Key", "Proximity Key"]
                }
              ]
            }
          ];
          
          // Filter sample products by category
          filtered = sampleProducts.filter((product: any) => {
            return product.category === categoryId;
          });
        }
        
        setProducts(filtered);
        setSortedProducts(filtered);
      } catch (err: any) {
        setError("Failed to load category or products.");
      }
      setLoading(false);
    }
    if (categoryId) fetchData();
  }, [categoryId]);

  // Listen to global vehicle filter events
  useEffect(() => {
    const handleVehicleFiltersChange = (event: CustomEvent) => {
      setVehicleFilters(event.detail);
    };

    const handleClearVehicleFilters = () => {
      setVehicleFilters(null);
    };

    window.addEventListener('vehicle-filters-change', handleVehicleFiltersChange as EventListener);
    window.addEventListener('clear-vehicle-filters', handleClearVehicleFilters);

    return () => {
      window.removeEventListener('vehicle-filters-change', handleVehicleFiltersChange as EventListener);
      window.removeEventListener('clear-vehicle-filters', handleClearVehicleFilters);
    };
  }, []);

  // Handle sorting and vehicle filtering
  useEffect(() => {
    let filtered = [...products];
    
    // Apply vehicle filters if they exist
    if (vehicleFilters) {
      filtered = filtered.filter(product => {
        if (!product.selectedCompatibility || !Array.isArray(product.selectedCompatibility)) {
          return false;
        }
        
        return product.selectedCompatibility.some((compatibility: any) => {
          // If only make is selected, show all products for that make
          if (vehicleFilters.make && !vehicleFilters.model && !vehicleFilters.yearRange) {
            return compatibility.brand === vehicleFilters.make;
          }
          
          // If make and model are selected, show all products for that make/model
          if (vehicleFilters.make && vehicleFilters.model && !vehicleFilters.yearRange) {
            // Check if product is compatible with this make/model combination
            // Product is compatible if:
            // 1. Exact match: brand=make AND model=model
            // 2. Universal model: brand=make AND model="" (empty = all models)
            return compatibility.brand === vehicleFilters.make && 
                   (compatibility.model === vehicleFilters.model || compatibility.model === "");
          }
          
          // If all three are selected, show specific products
          if (vehicleFilters.make && vehicleFilters.model && vehicleFilters.yearRange) {
            // Check if product is compatible with this make/model/year combination
            // Product is compatible if:
            // 1. Exact match: brand=make AND model=model AND yearRange matches
            // 2. Universal model: brand=make AND model="" AND yearRange matches
            // 3. Universal year: brand=make AND model=model AND (yearStart="" OR yearRange matches)
            // 4. Universal both: brand=make AND model="" AND (yearStart="" OR yearRange matches)
            
            const yearMatches = !compatibility.yearStart || 
                               (vehicleFilters.yearRange && compatibility.yearStart && compatibility.yearEnd &&
                                vehicleFilters.yearRange >= compatibility.yearStart && vehicleFilters.yearRange <= compatibility.yearEnd);
            
            return compatibility.brand === vehicleFilters.make && 
                   (compatibility.model === vehicleFilters.model || compatibility.model === "") &&
                   yearMatches;
          }
          
          return false;
        });
      });
    }
    
    // Apply sorting
    switch (sortBy) {
      case "price-high-to-low":
        filtered.sort((a, b) => {
          const priceA = typeof a.price === 'string' 
            ? parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0
            : typeof a.price === 'number' ? a.price : 0;
          const priceB = typeof b.price === 'string'
            ? parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0
            : typeof b.price === 'number' ? b.price : 0;
          return priceB - priceA;
        });
        break;
      case "price-low-to-high":
        filtered.sort((a, b) => {
          const priceA = typeof a.price === 'string'
            ? parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0
            : typeof a.price === 'number' ? a.price : 0;
          const priceB = typeof b.price === 'string'
            ? parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0
            : typeof b.price === 'number' ? b.price : 0;
          return priceA - priceB;
        });
        break;
      default:
        // Keep original order
        break;
    }
    
    setSortedProducts(filtered);
    setCurrentPage(1); // Reset to first page when sorting or filtering changes
  }, [products, sortBy, vehicleFilters]);

  // Pagination logic
  const itemsPerPage = 42;
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Vehicle filter handlers
  const handleVehicleFiltersChange = (filters: {
    make: string;
    model: string;
    yearRange: string;
  }) => {
    setVehicleFilters(filters);
  };

  const handleClearVehicleFilters = () => {
    setVehicleFilters(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-blue-200 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
          {category ? category.name : "Category"}
        </h1>
      </div>
      
      {/* Sort Options */}
      {products.length > 0 && (
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            >
              <option value="default">Default</option>
              <option value="price-high-to-low">Price: High to Low</option>
              <option value="price-low-to-high">Price: Low to High</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Vehicle Filter Indicator */}
      {vehicleFilters && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600">Filtered for:</span>
                             <span className="font-semibold text-blue-800">
                 {vehicleFilters.make}
                 {vehicleFilters.model && ` ${vehicleFilters.model}`}
                 {vehicleFilters.yearRange && ` (${vehicleFilters.yearRange})`}
               </span>
            </div>
            <button
              onClick={handleClearVehicleFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {sortedProducts.length > 0 ? (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
            {currentProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                {...product} 
                image={product.images?.[0] || product.imageUrl || product.image || ''}
                vehicleCompatibility={product.vehicleCompatibility}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
                         {vehicleFilters 
               ? `No products found for ${vehicleFilters.make}${vehicleFilters.model ? ` ${vehicleFilters.model}` : ''}${vehicleFilters.yearRange ? ` (${vehicleFilters.yearRange})` : ''}`
               : 'No products found in this category.'
             }
          </p>
          {vehicleFilters && (
            <button
              onClick={handleClearVehicleFilters}
              className="mt-4 text-blue-400 hover:text-blue-300 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Product Counter - Always visible */}
      <div className="border-t border-gray-200 pt-4">
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {sortedProducts.length > 0 
                ? `${startIndex + 1}-${Math.min(endIndex, sortedProducts.length)} of ${sortedProducts.length} products`
                : `0 of 0 products`
              }
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-1">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border border-gray-300 rounded ${
                        currentPage === pageNum
                          ? 'bg-gray-100 text-gray-900'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {/* Next button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}