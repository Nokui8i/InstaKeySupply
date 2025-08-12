"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AdminLayout from "../../layout";

interface Product {
  id: string;
  title: string;
  price: string | number;
  salePrice?: string;
  regularPrice?: string;
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

interface Discount {
  id: string;
  name: string;
  type: string;
  value: number;
  active: boolean;
  applicableProducts: string[];
  applicableCategories: string[];
}

export default function DiscountTestPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch products with discount info
      const productsQuery = query(collection(db, "products"));
      const productsSnap = await getDocs(productsQuery);
      const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);

      // Fetch active discounts
      const discountsQuery = query(collection(db, "discounts"), where("active", "==", true));
      const discountsSnap = await getDocs(discountsQuery);
      const discountsData = discountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discount));
      setDiscounts(discountsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      return price.startsWith('$') ? price : `$${price}`;
    }
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  const discountedProducts = products.filter(p => p.discountInfo);
  const regularProducts = products.filter(p => !p.discountInfo);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Discount System Test</h1>
              <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1">
                Test and verify discount functionality
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {/* Active Discounts */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Active Discounts</h2>
            {discounts.length === 0 ? (
              <p className="text-gray-500 text-sm">No active discounts found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discounts.map(discount => (
                  <div key={discount.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{discount.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Type:</span> {discount.type}</p>
                      <p><span className="font-medium">Value:</span> {discount.value}</p>
                      <p><span className="font-medium">Products:</span> {discount.applicableProducts.length}</p>
                      <p><span className="font-medium">Categories:</span> {discount.applicableCategories.length}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products with Discounts */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Products with Discounts ({discountedProducts.length})
            </h2>
            {discountedProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">No products have discounts applied.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discountedProducts.map(product => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Original Price:</span> {formatPrice(product.discountInfo!.originalPrice)}</p>
                      <p><span className="font-medium">Discounted Price:</span> {formatPrice(product.discountInfo!.discountedPrice)}</p>
                      <p><span className="font-medium">Discount:</span> {formatPrice(product.discountInfo!.discountAmount)}</p>
                      <p><span className="font-medium">Discount Name:</span> {product.discountInfo!.discountName}</p>
                      <p><span className="font-medium">Type:</span> {product.discountInfo!.discountType}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regular Products */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Regular Products ({regularProducts.length})
            </h2>
            {regularProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">No regular products found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularProducts.slice(0, 9).map(product => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Price:</span> {formatPrice(product.price)}</p>
                    </div>
                  </div>
                ))}
                {regularProducts.length > 9 && (
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">+{regularProducts.length - 9} more products</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
