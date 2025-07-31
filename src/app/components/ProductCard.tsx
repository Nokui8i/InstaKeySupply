import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  id: string;
  image: string;
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

export default function ProductCard({
  id,
  image,
  title,
  model,
  price,
  oldPrice,
  isNew,
  isSale,
  vehicleCompatibility,
}: ProductCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/products/${id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white/90 rounded-2xl shadow-xl border border-gray-200 p-2 sm:p-3 md:p-4 max-w-xs w-full mx-auto flex flex-col items-center transition-all duration-300 hover:shadow-2xl relative overflow-hidden cursor-pointer"
    >
      {/* Badges */}
      {/* Product Image */}
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center mb-2 sm:mb-3 md:mb-4 border border-gray-100">
        <Image src={image} alt={title} width={160} height={160} className="object-contain" />
      </div>
      
      {/* Product Details */}
      <div className="w-full text-center flex-1 flex flex-col justify-between">
        <h3 className="product__title text-gray-900 text-xs sm:text-sm leading-tight mb-1 hover:text-blue-500 transition-colors cursor-pointer h-16 sm:h-20 overflow-hidden">
          {title}
        </h3>
        <div className="product__model text-gray-500 text-xs sm:text-sm mb-2">{model}</div>
        
        {/* NEW: Vehicle Compatibility Display */}
        {vehicleCompatibility && vehicleCompatibility.makes.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-blue-600 font-medium mb-1">Compatible with:</div>
            <div className="flex flex-wrap gap-1 justify-center">
              {vehicleCompatibility.makes.slice(0, 2).map((make, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {make}
                </span>
              ))}
              {vehicleCompatibility.makes.length > 2 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  +{vehicleCompatibility.makes.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
          {oldPrice && (
            <span className="price--normal text-gray-400 line-through text-xs sm:text-sm">{oldPrice}</span>
          )}
          <span className="product__price bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1 rounded-full shadow-sm">
            {price}
          </span>
        </div>
      </div>
      
      {/* Add to Cart Button - Mobile optimized */}
      <button className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold rounded-b-2xl py-2 px-2 text-xs sm:text-sm shadow hover:brightness-110 transition-all duration-300 opacity-0 group-hover:opacity-100 group-active:opacity-100 pointer-events-none group-hover:pointer-events-auto group-active:pointer-events-auto min-h-[44px] touch-manipulation">
        Add to Cart
      </button>
    </div>
  );
} 