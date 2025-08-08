"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../components/CartContext';
import { FaCheckCircle, FaShoppingCart } from 'react-icons/fa';

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Clear cart immediately
      clearCart();
      
      // Redirect to main page after 3 seconds
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // No session ID, redirect immediately
      router.push('/');
    }
  }, [searchParams, clearCart, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-md mx-auto text-center">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
          <FaCheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Thank you for your purchase. Your order has been confirmed and you'll receive a confirmation email shortly.
        </p>

        {/* Manual Redirect Button */}
        <button
          onClick={() => router.push('/')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
        >
          <FaShoppingCart className="mr-2" />
          Continue Shopping Now
        </button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
} 