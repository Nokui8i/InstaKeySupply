import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  id: string;
  image: string;
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
  imageUrl?: string;
  images?: string[];
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
  // NEW: Discount information
  discountInfo?: {
    discountId: string;
    discountName: string;
    discountType: string;
    discountValue: number;
    originalPrice: string;
    discountedPrice: string;
    discountAmount: string;
    appliedAt: any;
    validUntil: any;
  };
}

// Helper function to format price consistently
const formatPrice = (price: string | number): string => {
  if (typeof price === 'string') {
    // If price already has $, return as is
    if (price.startsWith('$')) {
      return price;
    }
    // If price is a number string, add $
    return `$${price}`;
  }
  // If price is a number, add $
  return `$${price.toFixed(2)}`;
};

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
  discountInfo,
}: ProductCardProps) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);

  const handleCardClick = () => {
    router.push(`/products/${id}`);
  };

  // Ensure image has a valid URL
  const imageUrl = image || '/sample-key-1.png'; // Fallback image

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-lg shadow-md border border-gray-200 p-2 sm:p-3 md:p-4 max-w-[180px] sm:max-w-xs w-full mx-auto flex flex-col items-center transition-all duration-300 hover:shadow-lg relative overflow-hidden cursor-pointer"
    >
      {/* Badges */}
      {/* Product Image */}
      <div className="w-full aspect-square rounded-md overflow-hidden bg-gray-50 flex items-center justify-center mb-2 sm:mb-3 border border-gray-100 relative">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <div className="w-5 h-5 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <Image 
          src={imageUrl} 
          alt={title} 
          width={160} 
          height={160} 
          className={`object-contain p-2 transition-all duration-500 ${imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          priority={true}
          loading="eager"
          placeholder="empty"
          onLoad={() => setImageLoading(false)}
          onError={(e) => {
            // Fallback to sample image if main image fails
            const target = e.target as HTMLImageElement;
            target.src = '/sample-key-1.png';
            setImageLoading(false);
          }}
        />
      </div>
      
      {/* Product Details */}
      <div className="w-full text-center flex-1 flex flex-col justify-between">
        <h3 className="product__title text-gray-900 text-xs sm:text-sm leading-tight mb-1 hover:text-blue-500 transition-colors cursor-pointer h-10 sm:h-16 md:h-20 overflow-hidden font-medium">
          {title}
        </h3>
        <div className="product__model text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">{model}</div>
        
        {/* NEW: Vehicle Compatibility Display */}
        {vehicleCompatibility && vehicleCompatibility.makes.length > 0 && (
          <div className="mb-1 sm:mb-2">
            <div className="text-xs text-blue-600 font-medium mb-1">Compatible with:</div>
            <div className="flex flex-wrap gap-1 justify-center">
              {vehicleCompatibility.makes.slice(0, 2).map((make, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  {make}
                </span>
              ))}
              {vehicleCompatibility.makes.length > 2 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  +{vehicleCompatibility.makes.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
          {/* Show discount info if available */}
          {discountInfo ? (
            <>
              <span className="price--normal text-gray-400 line-through text-xs sm:text-sm">
                {formatPrice(discountInfo.originalPrice)}
              </span>
              <span className="product__price text-red-600 font-bold text-sm sm:text-base md:text-lg">
                {formatPrice(discountInfo.discountedPrice)}
              </span>
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                {discountInfo.discountType === 'percentage' ? `${discountInfo.discountValue}% OFF` : `$${discountInfo.discountValue} OFF`}
              </div>
            </>
          ) : (
            <>
              {oldPrice && (
                <span className="price--normal text-gray-400 line-through text-xs sm:text-sm">
                  {formatPrice(oldPrice)}
                </span>
              )}
              <span className="product__price text-blue-600 font-bold text-sm sm:text-base md:text-lg">
                {formatPrice(price)}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Add to Cart Button - Mobile optimized */}
      <button className="w-full bg-blue-600 text-white font-medium rounded-md py-2 px-3 text-xs sm:text-sm shadow hover:bg-blue-700 transition-all duration-300 mt-2">
        Add to Cart
      </button>
    </div>
  );
} 