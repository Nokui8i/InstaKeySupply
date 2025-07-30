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
  price: string;
  oldPrice?: string;
  imageUrl: string;
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

  // Fetch best sellers (for now, just 6 products excluding the current one)
  useEffect(() => {
    async function fetchBestSellers() {
      try {
        const productsSnap = await getDocs(query(collection(db, "products")));
        const allProducts = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];
        // Exclude the current product
        const filtered = allProducts.filter((p) => p.id !== params.id).slice(0, 6);
        setBestSellers(filtered);
      } catch (err) {
        setBestSellers([]);
      }
    }
    if (product) fetchBestSellers();
  }, [product, params.id]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    console.log('handleAddToCart called:', { product, quantity });
    addToCart({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      imageUrl: product.images?.[0] || product.imageUrl,
      quantity,
      stock: product.stock || 1,
    }, quantity);
    setNotification('Added to cart!');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

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

  const isOnSale = product.oldPrice && parseFloat(product.oldPrice) > parseFloat(product.price);
  const discountPercentage = isOnSale 
    ? Math.round(((parseFloat(product.oldPrice!) - parseFloat(product.price)) / parseFloat(product.oldPrice!)) * 100)
    : 0;

  // Debug: log best sellers
  if (typeof window !== 'undefined') {
    console.log('Best Sellers for carousel:', bestSellers);
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
                src={product.images?.[selectedImage] || product.imageUrl}
                alt={product.title}
                fill
                className="object-contain"
                priority
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
                  ${product.price}
                </span>
                {isOnSale && (
                  <span className="text-xl text-gray-400 line-through ml-2">
                    ${product.oldPrice}
                  </span>
                )}
              </div>
              {isOnSale && (
                <p className="text-green-600 text-sm">
                  Save ${(parseFloat(product.oldPrice!) - parseFloat(product.price)).toFixed(2)} ({discountPercentage}% off)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
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
        {product.description && (
          <div className="mt-12 flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="flex">
                <div className="w-1.5 rounded-l-xl bg-blue-600/80 mr-0.5" />
                <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-md px-6 py-5">
                  <h3 className="text-2xl font-bold text-blue-900 mb-4 tracking-tight">Description</h3>
                  <div className="text-sm">
                    {/* Parse and display description in table format */}
                    {product.description.split('\n').map((line, index) => {
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
                    })}
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
        {/* Best Sellers Carousel (moved to bottom) */}
        <section className="mt-16 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-blue-600 text-center drop-shadow">Best Sellers</h2>
          {bestSellers.length > 0 ? (
            <ProductCarousel products={bestSellers} />
          ) : (
            <div className="text-center text-gray-400 py-8">No best sellers yet.</div>
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