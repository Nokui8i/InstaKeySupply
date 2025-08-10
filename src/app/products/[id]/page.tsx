'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDocs, query, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Image from 'next/image';
import { ChevronLeftIcon, StarIcon, ShoppingCartIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import ProductCarousel from "../../components/ProductCarousel";
import { useCart } from '../../components/CartContext';
import { useAuth } from '../../components/AuthContext';

interface Product {
  id: string;
  title: string;
  model: string;
  price: string | number;
  oldPrice?: string | number;
  imageUrl?: string; // Make optional since sample products use 'image' field
  image?: string; // Add this field for sample products
  images?: string[];
  category?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  partNumber?: string;
  manufacturer?: string;
  stock?: number;
  lowStockAmount?: number;
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

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAllCompatibility, setShowAllCompatibility] = useState(false);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const [notification, setNotification] = useState<string | null>(null);
  const { user } = useAuth();
  const [wishlistMsg, setWishlistMsg] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // Fetch wishlist for logged-in user
  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }
    setWishlistLoading(true);
    getDoc(doc(db, 'wishlists', user.uid)).then(snap => {
      if (snap.exists()) {
        setWishlist(snap.data().items || []);
      } else {
        setWishlist([]);
      }
      setWishlistLoading(false);
    });
  }, [user]);

  const isWishlisted = user && product && wishlist.includes(product.id);

  const handleWishlist = async () => {
    if (!user || !product) return;
    setWishlistLoading(true);
    const ref = doc(db, 'wishlists', user.uid);
    try {
      if (isWishlisted) {
        await updateDoc(ref, { items: arrayRemove(product.id) });
        setWishlist(wishlist.filter(id => id !== product.id));
      } else {
        await setDoc(ref, { items: arrayUnion(product.id) }, { merge: true });
        setWishlist([...wishlist, product.id]);
      }
    } catch (e) {
      setWishlistMsg('Error updating wishlist.');
      setTimeout(() => setWishlistMsg(null), 2000);
    }
    setWishlistLoading(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMsg('Link copied!');
    } catch {
      setShareMsg('Failed to copy link.');
    }
    setTimeout(() => setShareMsg(null), 2000);
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!params.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const productDoc = await getDoc(doc(db, 'products', params.id as string));
        
        if (productDoc.exists()) {
          setProduct({
            id: productDoc.id,
            ...productDoc.data()
          } as Product);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id]);

  // Fetch random products (always show sample products for now)
  useEffect(() => {
    async function fetchRandomProducts() {
      try {
        // Always use sample products for the carousel
        const sampleProducts: Product[] = [
          {
            id: "sample-1",
            image: "/sample-key-1.png", // Use 'image' instead of 'imageUrl' for consistency
            imageUrl: "/sample-key-1.png", // Add imageUrl for compatibility
            title: "Toyota Camry Transponder Key",
            model: "TOY-4D60",
            price: "$89.99",
            oldPrice: "$129.99",
            category: "Car Keys",
            vehicleType: "Car" as const,
            description: "High-quality transponder key for Toyota Camry models",
            selectedCompatibility: [
              {
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
            imageUrl: "/sample-key-2.png", // Add imageUrl for compatibility
            title: "Honda Accord Remote Key",
            model: "HON-72MHz",
            price: "$79.95",
            category: "Car Keys",
            vehicleType: "Car" as const,
            description: "Remote key fob for Honda Accord with keyless entry",
            selectedCompatibility: [
              {
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
            image: "/sample-key-3.png", // Use 'image' instead of 'imageUrl' for consistency
            imageUrl: "/sample-key-3.png", // Add imageUrl for compatibility
            title: "BMW 3-Series Smart Key",
            model: "BMW-868MHz",
            price: "$199.99",
            oldPrice: "$249.99",
            category: "Car Keys",
            vehicleType: "Car" as const,
            description: "Advanced smart key for BMW 3-Series with comfort access",
            selectedCompatibility: [
              {
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
            image: "/sample-key-4.png", // Use 'image' instead of 'imageUrl' for consistency
            imageUrl: "/sample-key-4.png", // Add imageUrl for compatibility
            title: "Ford F-150 Remote Key",
            model: "FORD-315MHz",
            price: "$69.99",
            category: "Car Keys",
            vehicleType: "Truck" as const,
            description: "Remote key for Ford F-150 pickup trucks",
            selectedCompatibility: [
              {
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
            image: "/sample-key-5.png", // Use 'image' instead of 'imageUrl' for consistency
            imageUrl: "/sample-key-5.png", // Add imageUrl for compatibility
            title: "Chevrolet Silverado Key",
            model: "CHEV-433MHz",
            price: "$59.95",
            category: "Car Keys",
            vehicleType: "Truck" as const,
            description: "Standard key for Chevrolet Silverado models",
            selectedCompatibility: [
              {
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
            image: "/sample-key-6.png", // Use 'image' instead of 'imageUrl' for consistency
            imageUrl: "/sample-key-6.png", // Add imageUrl for compatibility
            title: "Nissan Altima Smart Key",
            model: "NISS-434MHz",
            price: "$149.99",
            category: "Car Keys",
            vehicleType: "Car" as const,
            description: "Smart key system for Nissan Altima with push-button start",
            selectedCompatibility: [
              {
                brand: "Nissan",
                model: "Altima",
                yearStart: "2013",
                yearEnd: "2024",
                keyTypes: ["Smart Key", "Proximity Key"]
              }
            ]
          }
        ];
        
        // Exclude the current product if it's a sample product
        const filtered = sampleProducts.filter((p) => p.id !== params.id);
        
        // Shuffle the array to get random products
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        // Take first 6 random products
        const randomProducts = shuffled.slice(0, 6);
        
        console.log('Random products for carousel:', randomProducts.length, randomProducts);
        setBestSellers(randomProducts);
      } catch (err) {
        console.error('Error fetching random products:', err);
        setBestSellers([]);
      }
    }
    
    fetchRandomProducts();
  }, [params.id]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      console.log('Product page: Changing quantity from', quantity, 'to', newQuantity);
      setQuantity(newQuantity);
      console.log('Product page: Quantity state updated to:', newQuantity);
    } else {
      console.log('Product page: Invalid quantity change attempted:', { 
        current: quantity, 
        attempted: newQuantity
      });
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    console.log('Product page: Adding to cart:', { 
      product: product.id, 
      quantity, 
      price: product.price 
    });
    await addToCart({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      imageUrl: product.images?.[0] || product.imageUrl,
      quantity,
    }, quantity);
    setNotification('Added to cart!');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

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

  // Helper function to get the best available image
  const getProductImage = (product: Product): string => {
    if (product.images && product.images.length > 0 && product.images[selectedImage]) {
      return product.images[selectedImage];
    }
    if (product.imageUrl) {
      return product.imageUrl;
    }
    return '/sample-key-1.png'; // Fallback image
  };

  // Helper function to calculate discount percentage
  const calculateDiscountPercentage = (oldPrice: string | number, currentPrice: string | number): number => {
    const oldPriceNum = typeof oldPrice === 'string' ? parseFloat(oldPrice.replace('$', '')) : oldPrice;
    const currentPriceNum = typeof currentPrice === 'string' ? parseFloat(currentPrice.replace('$', '')) : currentPrice;
    return Math.round(((oldPriceNum - currentPriceNum) / oldPriceNum) * 100);
  };

  const isOnSale = product.oldPrice && parseFloat(product.oldPrice.toString().replace('$', '')) > parseFloat(product.price.toString().replace('$', ''));
  const discountPercentage = isOnSale 
    ? calculateDiscountPercentage(product.oldPrice!, product.price)
    : 0;

  // Debug: log best sellers
  if (typeof window !== 'undefined') {
    console.log('Best Sellers for carousel:', bestSellers);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
              <button
                onClick={() => router.back()}
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            Back to Products
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative mx-auto bg-white rounded-xl overflow-hidden shadow-2xl max-w-xs h-72 flex items-center justify-center">
              <Image
                src={getProductImage(product)}
                alt={product.title}
                fill
                className="object-contain"
                priority
                onError={(e) => {
                  // Fallback to sample image if main image fails
                  const target = e.target as HTMLImageElement;
                  target.src = '/sample-key-1.png';
                }}
              />
              {isOnSale && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  -{discountPercentage}%
                </div>
              )}
              {/* Wishlist and Share Icons (top right, stacked) */}
              <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                {user ? (
                  <button
                    className={`p-0 bg-transparent border-none shadow-none hover:text-pink-600 transition-all ${isWishlisted ? 'text-pink-600' : 'text-gray-400 hover:text-pink-500'}`}
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isWishlisted ? <HeartIconSolid className="w-6 h-6" /> : <HeartIcon className="w-6 h-6" />}
                  </button>
                ) : (
                  <button
                    className="p-0 bg-transparent border-none shadow-none text-gray-400 hover:text-pink-500 transition-all"
                    onClick={() => {
                      setWishlistMsg('Please log in to use the wishlist.');
                      setTimeout(() => setWishlistMsg(null), 2000);
                    }}
                    title="Log in to use wishlist"
                  >
                    <HeartIcon className="w-6 h-6" />
                  </button>
                )}
                <button
                  className="p-0 bg-transparent border-none shadow-none text-blue-500 hover:text-blue-700 transition-all"
                  title="Share"
                  onClick={handleShare}
                >
                  <ShareIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-blue-400 shadow-lg' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Model */}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              {product.model && (
                <p className="text-xl text-gray-600 font-medium">
                  Model: {product.model}
                </p>
              )}
            </div>

            {/* SKU, Part Number, Manufacturer (compact) */}
            <div className="space-y-1 mb-2">
              {product.sku && (
                <div className="text-sm text-gray-500">
                  SKU: <span className="text-gray-900 font-mono">{product.sku}</span>
                </div>
              )}
              {product.partNumber && (
                <div className="text-sm text-gray-500">
                  Part Number: <span className="text-gray-900 font-mono">{product.partNumber}</span>
                </div>
              )}
              {product.manufacturer && (
                <div className="text-sm text-gray-500">
                  Manufacturer: <span className="text-gray-900 font-mono">{product.manufacturer}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2 text-center">
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {isOnSale && (
                  <span className="text-xl text-gray-400 line-through ml-2">
                    {formatPrice(product.oldPrice!)}
                  </span>
                )}
              </div>
              {isOnSale && (
                <p className="text-green-600 text-sm">
                  Save ${(parseFloat(product.oldPrice!.toString().replace('$', '')) - parseFloat(product.price.toString().replace('$', ''))).toFixed(2)} ({discountPercentage}% off)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Quantity Selection */}
              <div className="flex items-center justify-center gap-3">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors rounded-l-lg"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-sm px-3 py-2 bg-gray-50">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors rounded-r-lg"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  Unlimited stock
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button
                  onClick={handleAddToCart}
                  className="w-full sm:w-auto flex-1 border-2 border-blue-600 text-blue-700 bg-white hover:bg-blue-50 hover:border-blue-700 hover:text-blue-800 font-bold py-2 px-4 rounded-full shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full sm:w-auto flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-200 text-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  Buy Now
                </button>
              </div>

              {/* Removed large Wishlist/Share buttons */}
            </div>
          </div>
        </div>

        {/* Description - Centered */}
        {(product.description || product.customFields) && (
          <div className="mt-12 flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="flex">
                <div className="w-1.5 rounded-l-xl bg-blue-600/80 mr-0.5" />
                <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-md px-6 py-5">
                  <h3 className="text-2xl font-bold text-blue-900 mb-4 tracking-tight">Description</h3>
                  <div className="text-sm">
                    {/* Display custom fields if available (flexible form) */}
                    {product.customFields && product.customFields.length > 0 ? (
                      product.customFields.map((field, index) => (
                        <div key={field.id || index} className="flex border-b border-gray-200 last:border-b-0">
                          <div className="w-1/3 bg-gray-100 px-3 py-2 font-medium text-gray-700 border-r border-gray-200">
                            {field.label}
                          </div>
                          <div className="w-2/3 px-3 py-2 text-gray-900">
                            {/* Format all fields with each item on a separate line */}
                            <div className="space-y-1">
                              {field.value.split(/[\n\r*]+/).map((item, itemIndex) => {
                                const trimmedItem = item.trim();
                                if (trimmedItem.length > 0) {
                                  return (
                                    <div key={itemIndex} className="text-sm">
                                      {trimmedItem}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Parse and display description in table format (automotive form) */
                      product.description?.split('\n').map((line, index) => {
                        // Skip the "TECHNICAL SPECIFICATIONS:" title line
                        if (line.trim() === 'TECHNICAL SPECIFICATIONS:') {
                          return null;
                        }
                        
                        if (line.includes(':')) {
                          const [label, value] = line.split(':').map(part => part.trim());
                          if (label && value) {
                            // Special handling for WORKS ON THE FOLLOWING MODELS
                            if (label === 'WORKS ON THE FOLLOWING MODELS') {
                              const models = value.split(',').map(model => model.trim());
                              return (
                                <div key={index} className="flex border-b border-gray-200 last:border-b-0">
                                  <div className="w-1/3 bg-gray-100 px-3 py-2 font-medium text-gray-700 border-r border-gray-200">
                                    {label}
                                  </div>
                                  <div className="w-2/3 px-3 py-2 text-gray-900">
                                    <div className="space-y-1">
                                      {models.map((model, modelIndex) => (
                                        <div key={modelIndex} className="text-sm">
                                          {model}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <div key={index} className="flex border-b border-gray-200 last:border-b-0">
                                <div className="w-1/3 bg-gray-100 px-3 py-2 font-medium text-gray-700 border-r border-gray-200">
                                  {label}
                                </div>
                                <div className="w-2/3 px-3 py-2 text-gray-900">
                                  {value}
                                </div>
                              </div>
                            );
                          }
                        }
                        // Handle lines without colons (like section headers)
                        if (line.trim()) {
                          return (
                            <div key={index} className="px-3 py-2 font-semibold text-gray-800 bg-blue-50 border-b border-gray-200">
                              {line}
                            </div>
                          );
                        }
                        return null;
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Warranty & Policies */}
          {(product.warranty || product.returnPolicy || product.shippingInfo) && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Policies & Information</h3>
              <div className="space-y-3">
                {product.warranty && (
                  <div>
                    <span className="text-gray-700 font-medium">Warranty:</span>
                    <p className="text-gray-600 text-sm mt-1">{product.warranty}</p>
                  </div>
                )}
                {product.returnPolicy && (
                  <div>
                    <span className="text-gray-700 font-medium">Return Policy:</span>
                    <p className="text-gray-600 text-sm mt-1">{product.returnPolicy}</p>
                  </div>
                )}
                {product.shippingInfo && (
                  <div>
                    <span className="text-gray-700 font-medium">Shipping Info:</span>
                    <p className="text-gray-600 text-sm mt-1">{product.shippingInfo}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Installation Notes */}
          {product.installationNotes && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Installation Notes</h3>
              <p className="text-gray-600 leading-relaxed">{product.installationNotes}</p>
            </div>
          )}

          {/* Purchase Note */}
          {product.purchaseNote && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Important Note</h3>
              <p className="text-gray-600 leading-relaxed">{product.purchaseNote}</p>
            </div>
          )}
        </div>
        {/* Random Products Carousel (moved to bottom) */}
        <section className="mt-16 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-blue-600 text-center drop-shadow">You Might Also Like</h2>
          {bestSellers.length > 0 ? (
            <ProductCarousel products={bestSellers} />
          ) : (
            <div className="text-center text-gray-400 py-8">No products available.</div>
          )}
        </section>
      </div>
      {notification && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg bg-green-500 text-white font-semibold">
          {notification}
        </div>
      )}
      {wishlistMsg && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg bg-blue-600 text-white text-xs font-semibold">
          {wishlistMsg}
        </div>
      )}
      {shareMsg && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg bg-blue-600 text-white text-xs font-semibold">
          {shareMsg}
        </div>
      )}
    </div>
  );
} 