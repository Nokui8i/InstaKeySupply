"use client";
import React, { useEffect, useState, Suspense } from "react";
import CarouselBanner from "./components/CarouselBanner";
import ProductCarousel from "./components/ProductCarousel";
import ProductCard from "./components/ProductCard";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import PromoModal from './components/PromoModal';
import { useSearchParams } from 'next/navigation';

const sampleProducts = [
  {
    image: "/sample-key-1.png",
    title: "Ford F-Series 3-Button Remote Key",
    model: "N5F-A08TBLP",
    price: "$188.95",
  },
  {
    image: "/sample-key-2.png",
    title: "Toyota Smart Key Proximity Remote",
    model: "HYQ14FBA",
    price: "$129.99",
    oldPrice: "$159.99",
  },
  {
    image: "/sample-key-3.png",
    title: "Honda Accord Transponder Key",
    model: "HON66T",
    price: "$39.95",
  },
  {
    image: "/sample-key-1.png",
    title: "Chevrolet Silverado Remote Key",
    model: "GM-13584512",
    price: "$99.99",
  },
  {
    image: "/sample-key-2.png",
    title: "BMW 5-Series Smart Key",
    model: "BMW-868MHz",
    price: "$249.99",
  },
  {
    image: "/sample-key-3.png",
    title: "Hyundai Elantra Remote Key",
    model: "HY22R",
    price: "$59.95",
  },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const [banners, setBanners] = useState<{ src: string; alt: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  
  // NEW: Vehicle compatibility and filter state
  const [activeFilters, setActiveFilters] = useState<{
    make: string;
    model: string;
    yearRange: string;
  } | null>(null);



  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Starting to fetch data...');
        
        // Fetch banners with timeout
        const bannersQuery = query(collection(db, "banners"), orderBy("imageUrl"));
        const bannersSnap = await Promise.race([
          getDocs(bannersQuery),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Banners timeout')), 10000))
        ]) as any;
        const fetchedBanners = bannersSnap.docs.map((doc: any) => ({
          src: doc.data().imageUrl,
          alt: doc.data().alt || "Banner image",
        }));
        setBanners(fetchedBanners);
        console.log('Banners fetched:', fetchedBanners.length);

        // Fetch products with timeout
        const productsQuery = query(collection(db, "products"), orderBy("title"));
        const productsSnap = await Promise.race([
          getDocs(productsQuery),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Products timeout')), 10000))
        ]) as any;
        const fetchedProducts = productsSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        console.log('Products fetched:', fetchedProducts.length);

        // Fetch categories
        const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
        const categoriesSnap = await getDocs(categoriesQuery);
        const fetchedCategories = categoriesSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(fetchedCategories);
        console.log('Categories fetched:', fetchedCategories.length);
        

        
        // If no products from Firebase, use sample products for testing
        if (fetchedProducts.length === 0) {
          console.log('No products from Firebase, using sample products');
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
          setProducts(sampleProducts);
          setFilteredProducts(sampleProducts);
        } else {
          setProducts(fetchedProducts);
          setFilteredProducts(fetchedProducts);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        // Don't show error, just set empty arrays to allow page to load
        setBanners([]);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
        console.log('Data fetching completed');
      }
    }

    fetchData();

    // Promo modal logic: show every 4th visit (4, 8, 12, ...) on main page, with debug logging
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('promoModalDismissed');
      const shownCount = parseInt(localStorage.getItem('promoModalShownCount') || '0', 10);
      console.log('[PROMO POPUP] dismissed:', dismissed, 'shownCount:', shownCount);
      if (!dismissed) {
        const newCount = shownCount + 1;
        localStorage.setItem('promoModalShownCount', newCount.toString());
        console.log('[PROMO POPUP] incremented count to', newCount);
        if (newCount % 4 === 0) {
          setTimeout(() => {
            setShowPromo(true);
            console.log('[PROMO POPUP] Showing popup on count', newCount);
          }, 1200);
        }
      } else {
        console.log('[PROMO POPUP] Popup dismissed, will not show');
      }
    }
  }, []);

  // Handle category filtering from URL parameter
  useEffect(() => {
    const categoryId = searchParams.get('category');
    
    if (categoryId && products.length > 0) {
      // Filter products by categoryId
      const filtered = products.filter(product => product.categoryId === categoryId);
      setFilteredProducts(filtered);
      console.log(`Filtered products for category ${categoryId}:`, filtered.length);
    } else if (products.length > 0) {
      // Show all products if no category filter
      setFilteredProducts(products);
    }
  }, [searchParams, products]);

  // NEW: Listen for filter events from navbar
  useEffect(() => {
    const handleNavbarVehicleFiltersChange = (event: CustomEvent) => {
      handleVehicleFiltersChange(event.detail);
    };

    const handleNavbarClearVehicleFilters = () => {
      setActiveFilters(null);
      setFilteredProducts([...products]); // Use current products state
    };

    window.addEventListener('vehicle-filters-change', handleNavbarVehicleFiltersChange as EventListener);
    window.addEventListener('clear-vehicle-filters', handleNavbarClearVehicleFilters);

    return () => {
      window.removeEventListener('vehicle-filters-change', handleNavbarVehicleFiltersChange as EventListener);
      window.removeEventListener('clear-vehicle-filters', handleNavbarClearVehicleFilters);
    };
  }, [products]); // Add products to dependency array

  const handleFiltersChange = (filtered: any[]) => {
    setFilteredProducts(filtered);
  };

  // NEW: Vehicle compatibility filter logic
  const handleVehicleFiltersChange = (filters: {
    make: string;
    model: string;
    yearRange: string;
  }) => {
    setActiveFilters(filters);
    
    // Filter products based on vehicle compatibility
    const filtered = products.filter(product => {
      if (!product.compatibility || !Array.isArray(product.compatibility)) {
        return false;
      }
      
      return product.compatibility.some((compatibility: any) => {
        // If only make is selected, show all products for that make
        if (filters.make && !filters.model && !filters.yearRange) {
          return compatibility.make === filters.make;
        }
        
        // If make and model are selected, show all products for that make/model
        if (filters.make && filters.model && !filters.yearRange) {
          return compatibility.make === filters.make && 
                 compatibility.model === filters.model;
        }
        
        // If all three are selected, show specific products
        if (filters.make && filters.model && filters.yearRange) {
          return compatibility.make === filters.make &&
                 compatibility.model === filters.model &&
                 compatibility.yearRange === filters.yearRange;
        }
        
        return false;
      });
    });
    
    setFilteredProducts(filtered);
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setFilteredProducts([...products]); // Use spread operator to ensure we get a fresh copy
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-2 sm:pt-4 pb-8 sm:pb-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-blue-200 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-2 sm:pt-4 pb-8 sm:pb-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 pt-2 sm:pt-4 pb-8 sm:pb-12">
      <PromoModal open={showPromo} onClose={() => setShowPromo(false)} />
      
      {/* Hero Section - Carousel Banner */}
      <section className="mb-12 sm:mb-16 mt-0">
        <CarouselBanner images={banners} />
      </section>

      {/* Products Section */}
      {products.length > 0 && (
        <section className="mb-12 sm:mb-16">
          <div className="relative mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-600 drop-shadow text-center">All Products</h2>
            
            {/* Category Filter Display */}
            {searchParams.get('category') && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-600">Showing products in:</span>
                    <span className="font-semibold text-blue-800">
                      {categories.find(cat => cat.id === searchParams.get('category'))?.name || 'Unknown Category'}
                    </span>
                  </div>
                  <a 
                    href="/" 
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View All Products
                  </a>
                </div>
              </div>
            )}

          </div>
          
          {/* Products Display */}
          <div className="w-full">
            {activeFilters && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Filtered for:</strong> {activeFilters.make}
                {activeFilters.model && ` ${activeFilters.model}`}
                {activeFilters.yearRange && ` (${activeFilters.yearRange})`}
                </p>
                <p className="text-xs text-blue-600 mt-1 break-words">
                  Showing {filteredProducts.length} compatible product{filteredProducts.length !== 1 ? 's' : ''}
                  {activeFilters.make && !activeFilters.model && ' for all ' + activeFilters.make + ' models'}
                  {activeFilters.make && activeFilters.model && !activeFilters.yearRange && ' for all ' + activeFilters.make + ' ' + activeFilters.model + ' years'}
                  {activeFilters.make && activeFilters.model && activeFilters.yearRange && ' for ' + activeFilters.make + ' ' + activeFilters.model + ' ' + activeFilters.yearRange}
                </p>
              </div>
            )}
            
            {filteredProducts.length > 0 ? (
              <>
                {/* Mobile: 2 cards per row */}
                <div className="md:hidden">
                  <div className="grid grid-cols-2 gap-2 px-1">
                    {filteredProducts.slice(0, 8).map((product) => (
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
                </div>
                {/* Desktop: Carousel */}
                <div className="hidden md:block">
                  <ProductCarousel products={filteredProducts} />
                </div>
              </>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-400 text-base sm:text-lg px-4">
                  {searchParams.get('category') 
                    ? `No products found in "${categories.find(cat => cat.id === searchParams.get('category'))?.name || 'this category'}"`
                    : activeFilters 
                      ? `No products found for ${activeFilters.make}${activeFilters.model ? ` ${activeFilters.model}` : ''}${activeFilters.yearRange ? ` (${activeFilters.yearRange})` : ''}`
                      : 'No products available.'
                  }
                </p>
                {(activeFilters || searchParams.get('category')) && (
                  <button
                    onClick={() => {
                      if (searchParams.get('category')) {
                        window.location.href = '/';
                      } else {
                        handleClearFilters();
                      }
                    }}
                    className="mt-4 text-blue-400 hover:text-blue-300 underline text-sm sm:text-base"
                  >
                    {searchParams.get('category') ? 'View All Products' : 'Clear filters'}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Product Carousels */}
      {products.length > 0 && (
        <>
          <section className="mt-0 mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-blue-600 text-center drop-shadow px-4">Featured Car Keys</h2>
            {/* Mobile: 2 cards per row */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-2 px-1">
                {products.slice(0, 6).map((product) => (
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
            </div>
            {/* Desktop: Carousel */}
            <div className="hidden md:block">
              <ProductCarousel products={products.slice(0, 6)} />
            </div>
          </section>
          <section className="mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-blue-600 text-center drop-shadow px-4">Best Sellers</h2>
            {/* Mobile: 2 cards per row */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-2 px-1">
                {products.slice(0, 6).map((product) => (
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
            </div>
            {/* Desktop: Carousel */}
            <div className="hidden md:block">
              <ProductCarousel products={products.slice(0, 6)} />
            </div>
          </section>
          <section className="mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-blue-600 text-center drop-shadow px-4">New Arrivals</h2>
            {/* Mobile: 2 cards per row */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-2 px-1">
                {products.slice(0, 6).map((product) => (
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
            </div>
            {/* Desktop: Carousel */}
            <div className="hidden md:block">
              <ProductCarousel products={products.slice(0, 6)} />
            </div>
          </section>
        </>
      )}

      {/* Call to Action */}
      <section className="mt-12 sm:mt-16 md:mt-24 text-center px-4">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-blue-600">Need help or have a question?</h3>
        <p className="text-gray-300 mb-4 text-sm sm:text-base">Our expert team is here for you. Call, chat, or email us anytime.</p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('show-contact'))}
          className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-3 font-bold shadow hover:scale-105 hover:shadow-xl transition-all duration-300 border border-blue-300/40 min-h-[44px] flex items-center justify-center touch-manipulation text-sm sm:text-base"
        >
          Contact Support
        </button>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
