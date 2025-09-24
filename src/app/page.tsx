"use client";
import React, { useEffect, useState, Suspense, useCallback, memo } from "react";
import CarouselBanner from "./components/CarouselBanner";
import ProductCarousel from "./components/ProductCarousel";
import ProductCard from "./components/ProductCard";
import LogoCarousel from "./components/LogoCarousel";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import PromoModal from './components/PromoModal';
import { useSearchParams } from 'next/navigation';
import { carLogos } from "@/data/carLogos";

const sampleProducts = [
  {
    id: "sample-1",
    image: "/sample-key-1.png",
    imageUrl: "/sample-key-1.png",
    title: "Ford F-Series 3-Button Remote Key",
    model: "N5F-A08TBLP",
    price: "$188.95",
  },
  {
    id: "sample-2",
    image: "/sample-key-2.png",
    imageUrl: "/sample-key-2.png",
    title: "Toyota Smart Key Proximity Remote",
    model: "HYQ14FBA",
    price: "$129.99",
    oldPrice: "$159.99",
  },
  {
    id: "sample-3",
    image: "/sample-key-3.png",
    imageUrl: "/sample-key-3.png",
    title: "Honda Accord Transponder Key",
    model: "HON66T",
    price: "$39.95",
  },
  {
    id: "sample-4",
    image: "/sample-key-1.png",
    imageUrl: "/sample-key-1.png",
    title: "Chevrolet Silverado Remote Key",
    model: "GM-13584512",
    price: "$99.99",
  },
  {
    id: "sample-5",
    image: "/sample-key-2.png",
    imageUrl: "/sample-key-2.png",
    title: "BMW 5-Series Smart Key",
    model: "BMW-868MHz",
    price: "$249.99",
  },
  {
    id: "sample-6",
    image: "/sample-key-3.png",
    imageUrl: "/sample-key-3.png",
    title: "Hyundai Elantra Remote Key",
    model: "HY22R",
    price: "$59.95",
  },
];

const HomeContent = memo(function HomeContent() {
  const searchParams = useSearchParams();
  const [banners, setBanners] = useState<{ src: string; alt: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Shuffled product arrays for different carousels
  const [shuffledProducts, setShuffledProducts] = useState<{
    featured: any[];
    bestSellers: any[];
    newArrivals: any[];
    allProducts: any[];
  }>({ featured: [], bestSellers: [], newArrivals: [], allProducts: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  




  // Function to shuffle products for carousels
  const shuffleProducts = useCallback((productsArray: any[]) => {
    if (!productsArray || productsArray.length === 0) return [];
    return [...productsArray].sort(() => Math.random() - 0.5);
  }, []);



  // Periodically reshuffle products for variety - optimized
  useEffect(() => {
    if (products.length > 0) {
      // Initial shuffle
      setShuffledProducts({
        featured: shuffleProducts(products),
        bestSellers: shuffleProducts(products),
        newArrivals: shuffleProducts(products),
        allProducts: shuffleProducts(products)
      });

      // Only reshuffle every 30 minutes instead of 5 minutes
      const reshuffleInterval = setInterval(() => {
        setShuffledProducts(prev => ({
          featured: shuffleProducts(products),
          bestSellers: shuffleProducts(products),
          newArrivals: shuffleProducts(products),
          allProducts: shuffleProducts(products)
        }));
      }, 1800000); // Reshuffle every 30 minutes

      return () => clearInterval(reshuffleInterval);
    }
  }, [products, shuffleProducts]);

  // Preload important images for faster loading
  useEffect(() => {
    if (products.length > 0) {
      // Preload first 12 product images (2 rows of 6)
      const imagesToPreload = products.slice(0, 12).map(product => 
        product.images?.[0] || product.imageUrl
      ).filter(Boolean);
      
      imagesToPreload.forEach(imageUrl => {
        if (imageUrl && imageUrl !== '/sample-key-1.png') {
          const img = new Image();
          img.src = imageUrl;
        }
      });
    }
  }, [products]);

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
        
        // Create shuffled arrays for different carousels
        const shuffledFeatured = shuffleProducts(fetchedProducts);
        const shuffledBestSellers = shuffleProducts(fetchedProducts);
        const shuffledNewArrivals = shuffleProducts(fetchedProducts);
        const shuffledAllProducts = shuffleProducts(fetchedProducts);
        
        setShuffledProducts({
          featured: shuffledFeatured,
          bestSellers: shuffledBestSellers,
          newArrivals: shuffledNewArrivals,
          allProducts: shuffledAllProducts
        });
        
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
              image: "/sample-key-1.png", // Use 'image' instead of 'imageUrl' for consistency
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
              image: "/sample-key-2.png", // Use 'image' instead of 'imageUrl' for consistency
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
              image: "/sample-key-3.png", 
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
              image: "/sample-key-4.png",
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
              image: "/sample-key-5.png",
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
              image: "/sample-key-6.png",
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
        } else {
          setProducts(fetchedProducts);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        // Don't show error, just set empty arrays to allow page to load
        setBanners([]);
        setProducts([]);
      } finally {
        setLoading(false);
        console.log('Data fetching completed');
      }
    }

    fetchData();

         // Promo modal logic: show on every refresh for testing
     if (typeof window !== 'undefined') {
       const shownCount = parseInt(localStorage.getItem('promoModalShownCount') || '0', 10);
       const newCount = shownCount + 1;
       localStorage.setItem('promoModalShownCount', newCount.toString());
       console.log('[PROMO POPUP] incremented count to', newCount);
       
                               // Show popup every 4th refresh
         if (newCount % 4 === 0) {
         setTimeout(() => {
           setShowPromo(true);
           console.log('[PROMO POPUP] Showing popup on count', newCount);
         }, 1200);
       }
     }
  }, []);







  // Show loading state with website icon
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center -mt-32 sm:-mt-40">
          {/* Website Icon/Logo */}
          <div className="mb-8">
            <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center animate-pulse">
              <img 
                src="/Untitled design.png" 
                alt="INSTAKEY Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Loading Animation */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
    <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 pt-2 sm:pt-4 pb-8 sm:pb-12 animate-fade-in">
      <PromoModal open={showPromo} onClose={() => setShowPromo(false)} />
      
      {/* Hero Section - Carousel Banner */}
      <section className="mb-12 sm:mb-16 mt-0">
        <CarouselBanner images={banners} />
      </section>

      {/* Products Section */}
      {products.length > 0 && (
        <section className="mb-12 sm:mb-16">
          <div className="relative mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-600 drop-shadow text-center">
              All Products
            </h2>
            
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
                    className="text-sm text-blue-600 hover:text-blue-300 underline"
                  >
                    View All Products
                  </a>
                </div>
              </div>
            )}

          </div>
          
          {/* Products Display */}
          <div className="w-full">
            {products.length > 0 ? (
              <>
                {/* Mobile: 2 cards per row */}
                <div className="md:hidden">
                  <div className="grid grid-cols-2 gap-3 px-3">
                    {shuffledProducts.allProducts.slice(0, 8).map((product) => (
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
                  <ProductCarousel products={shuffledProducts.allProducts} />
                </div>
              </>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-400 text-base sm:text-lg px-4">
                  {searchParams.get('category') 
                    ? `No products found in "${categories.find(cat => cat.id === searchParams.get('category'))?.name || 'this category'}"`
                    : 'No products available.'
                  }
                </p>
                {searchParams.get('category') && (
                  <a 
                    href="/" 
                    className="mt-4 inline-block text-blue-400 hover:text-blue-300 underline text-sm sm:text-base"
                  >
                    View All Products
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Logo Carousel - Trusted Brands */}
      <section className="mb-12 sm:mb-16">
        <LogoCarousel logos={carLogos} />
      </section>

      {/* Featured Product Carousels */}
      {products.length > 0 && shuffledProducts.featured.length > 0 && (
        <>
          <section className="mt-0 mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-blue-600 text-center drop-shadow px-4">Featured Car Keys</h2>
            {/* Mobile: 2 cards per row */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-3 px-3">
                {shuffledProducts.featured.slice(0, 6).map((product) => (
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
              <ProductCarousel products={shuffledProducts.featured} />
            </div>
          </section>
          <section className="mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-blue-600 text-center drop-shadow px-4">Best Sellers</h2>
            {/* Mobile: 2 cards per row */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-3 px-3">
                {shuffledProducts.bestSellers.slice(0, 6).map((product) => (
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
              <ProductCarousel products={shuffledProducts.bestSellers} />
            </div>
          </section>
          <section className="mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-blue-600 text-center drop-shadow px-4">New Arrivals</h2>
            {/* Mobile: 2 cards per row */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-3 px-3">
                {shuffledProducts.newArrivals.slice(0, 6).map((product) => (
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
              <ProductCarousel products={shuffledProducts.newArrivals} />
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
});

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
