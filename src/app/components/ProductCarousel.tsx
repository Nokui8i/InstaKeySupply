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

  return (
    <div className="relative w-full">
      {/* Mobile: show all products in a 2-column grid, no carousel */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        {products.map((p, i) => (
          <ProductCard 
            key={p.id || i} 
            {...p} 
            image={p.images?.[0] || p.imageUrl || p.image || ''}
          />
        ))}
      </div>
      {/* Desktop: carousel with 6 items per page */}
      <div className="hidden md:flex items-center">
        {/* Left Arrow */}
        <button
          onClick={prev}
          disabled={start === 0}
          className="mr-2 bg-transparent text-blue-700 text-3xl font-bold p-1 rounded hover:text-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous products"
        >
          {'<'}
        </button>
        {/* Product Cards */}
        <div className="grid grid-cols-6 gap-4 flex-1">
                  {products.slice(start, start + perPage).map((p, i) => (
          <ProductCard 
            key={p.id || i} 
            {...p} 
            image={p.images?.[0] || p.imageUrl || p.image || ''}
          />
        ))}
        </div>
        {/* Right Arrow */}
        <button
          onClick={next}
          disabled={start >= maxStart}
          className="ml-2 bg-transparent text-blue-700 text-3xl font-bold p-1 rounded hover:text-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next products"
        >
          {'>'}
        </button>
      </div>
    </div>
  );
} 