"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  imageUrl?: string;
  image?: string;
  images?: string[];
  title: string;
  model: string;
  price: string | number;
  oldPrice?: string | number;
  isNew?: boolean;
  isSale?: boolean;
  // NEW: Vehicle compatibility
  vehicleCompatibility?: {
    makes: string[];
    models: string[];
    yearRanges: string[];
  };
  // Additional fields for consistency with Product interface
  category?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  partNumber?: string;
  manufacturer?: string;
  stock?: number;
  status?: 'active' | 'inactive' | 'out-of-stock' | 'coming-soon';
  isFeatured?: boolean;
  visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
  salePrice?: string;
  regularPrice?: string;
  vehicleType?: 'Car' | 'Truck' | 'SUV' | 'Van' | 'Motorcycle' | 'ATV' | 'Boat' | 'RV' | 'Commercial';
  brand?: string;
  year?: number;
  keyType?: string;
  availability?: 'in-stock' | 'out-of-stock' | 'coming-soon' | 'discontinued';
  compatibleModels?: string[];
  replacesKeyTypes?: string[];
  technicalSpecs?: {
    reusable?: boolean;
    cloneable?: boolean;
    chipType?: string;
    testBlade?: string;
    frequency?: string;
    batteryType?: string;
    fccId?: string;
    can?: string;
    buttons?: string[];
    emergencyKeyIncluded?: boolean;
    aftermarket?: boolean;
  };
  oemPartNumber?: string;
  aftermarketPartNumber?: string;
  buttonCount?: number;
  isOem?: boolean;
  isAftermarket?: boolean;
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: string;
  installationNotes?: string;
  selectedCompatibility?: Array<{
    brand: string;
    model: string;
    yearStart: string;
    yearEnd: string;
    keyTypes: string[];
  }>;
  vehicleTypes?: string[];
  categories?: string[];
  tags?: string[];
  shippingClass?: string;
  allowReviews?: boolean;
  purchaseNote?: string;
  customFields?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  createdAt?: any;
  updatedAt?: any;
}

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const perPage = 6;
  
  // Fallback products if none provided
  const fallbackProducts = [
    {
      id: 'fallback-1',
      title: 'Sample Key 1',
      model: 'Universal',
      price: '$9.99',
      image: '/sample-key-1.png'
    },
    {
      id: 'fallback-2',
      title: 'Sample Key 2',
      model: 'Universal',
      price: '$12.99',
      image: '/sample-key-2.png'
    },
    {
      id: 'fallback-3',
      title: 'Sample Key 3',
      model: 'Universal',
      price: '$8.99',
      image: '/sample-key-3.png'
    },
    {
      id: 'fallback-4',
      title: 'Sample Key 4',
      model: 'Universal',
      price: '$11.99',
      image: '/sample-key-4.png'
    },
    {
      id: 'fallback-5',
      title: 'Sample Key 5',
      model: 'Universal',
      price: '$10.99',
      image: '/sample-key-5.png'
    },
    {
      id: 'fallback-6',
      title: 'Sample Key 6',
      model: 'Universal',
      price: '$13.99',
      image: '/sample-key-6.png'
    }
  ];
  
  // Use fallback products if no products provided or if products array is empty
  const displayProducts = products && products.length > 0 ? products : fallbackProducts;
  
  // Navigation functions with true infinite scrolling
  const prev = () => {
    setCurrentIndex((current) => {
      if (current === 0) {
        // If at beginning, loop to the end
        return displayProducts.length - perPage;
      }
      return Math.max(0, current - perPage);
    });
  };
  
  const next = () => {
    setCurrentIndex((current) => {
      if (current >= displayProducts.length - perPage) {
        // If at end, loop back to beginning
        return 0;
      }
      return current + perPage;
    });
  };

  // Reset carousel position when products change
  useEffect(() => {
    setCurrentIndex(0);
  }, [displayProducts]);

  // Helper function to get the best available image
  const getProductImage = (product: Product): string => {
    // Priority: images[0] > imageUrl > image > fallback
    if (product.images && product.images.length > 0 && product.images[0]) {
      return product.images[0];
    }
    if (product.imageUrl) {
      return product.imageUrl;
    }
    if (product.image) {
      return product.image;
    }
    return '/sample-key-1.png'; // Fallback image
  };



  // If no products and no fallbacks, show a message
  if (!displayProducts || displayProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-lg">No products available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Fallback indicator only */}
      {products.length === 0 && (
        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
            Showing sample products
          </p>
        </div>
      )}
      
      {/* Mobile: show products with pagination */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prev}
            className="bg-white/90 backdrop-blur-sm text-blue-700 text-2xl font-bold p-2 rounded-full shadow-lg hover:text-blue-900 hover:bg-white transition-all duration-200 cursor-pointer"
            aria-label="Previous products"
          >
            ‹
          </button>

          <button
            onClick={next}
            className="bg-white/90 backdrop-blur-sm text-blue-700 text-2xl font-bold p-2 rounded-full shadow-lg hover:text-blue-900 hover:bg-white transition-all duration-200 cursor-pointer"
            aria-label="Next products"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {displayProducts.slice(currentIndex, currentIndex + perPage).map((p, i) => (
            <ProductCard 
              key={p.id || i} 
              {...p} 
              image={getProductImage(p)}
              vehicleCompatibility={(p as any).vehicleCompatibility}
            />
          ))}
        </div>
      </div>
      {/* Desktop: carousel with 6 items per page */}
      <div className="hidden md:flex items-center justify-center">
        {/* Left Arrow */}
        <button
          onClick={prev}
          className="mr-4 bg-white/90 backdrop-blur-sm text-blue-700 text-3xl font-bold p-3 rounded-full shadow-lg hover:text-blue-900 hover:bg-white transition-all duration-200 z-10 cursor-pointer"
          aria-label="Previous products"
        >
          ‹
        </button>
        
        {/* Product Cards Container */}
        <div className="flex-1 max-w-6xl overflow-hidden">
          <div className="grid grid-cols-6 gap-4">
            {displayProducts.slice(currentIndex, currentIndex + perPage).map((p, i) => (
              <ProductCard 
                key={p.id || i} 
                {...p} 
                image={getProductImage(p)}
                vehicleCompatibility={(p as any).vehicleCompatibility}
              />
            ))}
          </div>

        </div>
        
        {/* Right Arrow */}
        <button
          onClick={next}
          className="ml-4 bg-white/90 backdrop-blur-sm text-blue-700 text-3xl font-bold p-3 rounded-full shadow-lg hover:text-blue-900 hover:bg-white transition-all duration-200 z-10 cursor-pointer"
          aria-label="Next products"
        >
          ›
        </button>
      </div>
      

    </div>
  );
} 