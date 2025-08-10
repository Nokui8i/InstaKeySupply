"use client";
import React, { useState } from "react";
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
  const [start, setStart] = useState(0);
  const perPage = 6;
  const maxStart = Math.max(0, products.length - perPage);

  const prev = () => setStart((s) => Math.max(0, s - perPage));
  const next = () => setStart((s) => Math.min(maxStart, s + perPage));

  console.log('ProductCarousel received products:', products.length, products);

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

  // If no products, show a message
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-lg">No products available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Mobile: show all products in a responsive grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:hidden">
        {products.map((p, i) => (
          <ProductCard 
            key={p.id || i} 
            {...p} 
            image={getProductImage(p)}
            vehicleCompatibility={p.vehicleCompatibility}
          />
        ))}
      </div>
      {/* Desktop: carousel with 6 items per page */}
      <div className="hidden md:flex items-center justify-center">
        {/* Left Arrow */}
        <button
          onClick={prev}
          disabled={start === 0}
          className="mr-4 bg-transparent text-blue-700 text-3xl font-bold p-2 rounded hover:text-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous products"
        >
          {'<'}
        </button>
        {/* Product Cards */}
        <div className="grid grid-cols-6 gap-4 flex-1 max-w-6xl">
          {products.slice(start, start + perPage).map((p, i) => (
            <ProductCard 
              key={p.id || i} 
              {...p} 
              image={getProductImage(p)}
              vehicleCompatibility={p.vehicleCompatibility}
            />
          ))}
        </div>
        {/* Right Arrow */}
        <button
          onClick={next}
          disabled={start >= maxStart}
          className="ml-4 bg-transparent text-blue-700 text-3xl font-bold p-2 rounded hover:text-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next products"
        >
          {'>'}
        </button>
      </div>
    </div>
  );
} 