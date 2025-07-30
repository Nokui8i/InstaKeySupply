import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  id: string;
  image: string;
  imageUrl?: string;
  images?: string[];
  title: string;
  model: string;
  price: string;
  oldPrice?: string;
  isNew?: boolean;
  isSale?: boolean;
}

export default function ProductCard({
  id,
  image,
  imageUrl,
  images,
  title,
  model,
  price,
  oldPrice,
  isNew,
  isSale,
}: ProductCardProps) {
  const router = useRouter();


  const handleCardClick = () => {
    router.push(`/products/${id}`);
  };

  const imageSrc = images?.[0] || imageUrl || image;

  return (
    <div 
      onClick={handleCardClick}

      className="group bg-white/90 rounded-2xl shadow-xl border border-gray-200 p-3 sm:p-4 max-w-xs w-full mx-auto flex flex-col items-center transition-all duration-300 hover:shadow-2xl relative overflow-hidden cursor-pointer"
    >
      {/* Badges */}
      {/* Product Image */}
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center mb-3 sm:mb-4 border border-gray-100">
        <Image src={imageSrc} alt={title} width={160} height={160} className="object-contain" />
      </div>
      {/* Product Details */}
      <div className="w-full text-center flex-1 flex flex-col justify-between">
        <h3 className="product__title text-gray-900 font-semibold text-xs sm:text-sm leading-tight mb-1 hover:text-blue-500 transition-colors cursor-pointer h-10 overflow-hidden">
          {title}
        </h3>
        <div className="product__model text-gray-500 text-xs sm:text-sm mb-2">{model}</div>
        <div className="flex items-center justify-center gap-2 mb-3">
          {oldPrice && (
            <span className="price--normal text-gray-400 line-through text-xs sm:text-sm">{oldPrice}</span>
          )}
          <span className="product__price font-bold text-sm sm:text-base">{price}</span>
        </div>
      </div>
      {/* Add to Cart Button - Mobile optimized */}
      <button className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold rounded-b-2xl py-2 sm:py-1 px-2 text-xs sm:text-sm shadow hover:brightness-110 transition-all duration-300 opacity-0 group-hover:opacity-100 group-active:opacity-100 pointer-events-none group-hover:pointer-events-auto group-active:pointer-events-auto min-h-[44px] touch-manipulation">
        Add to Cart
      </button>
      

    </div>
  );
} 