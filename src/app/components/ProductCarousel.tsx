"use client";
import React, { useState } from "react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  imageUrl?: string;
  image?: string;
  images?: string[];
  title: string;
  model: string;
  price: string;
  oldPrice?: string;
  isNew?: boolean;
  isSale?: boolean;
  // NEW: Vehicle compatibility
  vehicleCompatibility?: {
    makes: string[];
    models: string[];
    yearRanges: string[];
  };
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:hidden">
        {products.map((p, i) => (
          <ProductCard 
            key={p.id || i} 
            {...p} 
            image={p.images?.[0] || p.imageUrl || p.image || ''}
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
              image={p.images?.[0] || p.imageUrl || p.image || ''}
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