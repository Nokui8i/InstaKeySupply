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
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Clear cart immediately
      clearCart();
      
      // Send email as fallback
      sendOrderEmail(sessionId);
      
      // Redirect to main page after 2 seconds using window.location
      const timer = setTimeout(() => {
        console.log('Redirecting to main page...');
        window.location.href = 'https://instakeysupply.com/';
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // No session ID, redirect immediately
      console.log('No session ID, redirecting immediately...');
      window.location.href = 'https://instakeysupply.com/';
    }
  }, [searchParams, clearCart]);

  const sendOrderEmail = async (sessionId: string) => {
    try {
      // Get order details first
      const orderResponse = await fetch(`/api/order-details?session_id=${sessionId}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        
        // Send email
        const emailResponse = await fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: orderData.customer,
            address: orderData.address,
            items: orderData.items,
            total: orderData.total,
            orderId: sessionId,
            firestoreOrderId: orderData.id,
          }),
        });

        if (emailResponse.ok) {
          console.log('Order email sent successfully from success page');
          setEmailSent(true);
        } else {
          console.error('Failed to send order email from success page');
        }
      }
    } catch (error) {
      console.error('Error sending order email from success page:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-md mx-auto text-center">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
          <FaCheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-lg text-gray-600 mb-4">
          Thank you for your purchase. Your order has been confirmed and you'll receive a confirmation email shortly.
        </p>
        
        {/* Email Status */}
        <p className="text-sm text-green-600 mb-8">
          {emailSent ? '✓ Email sent successfully!' : 'Sending confirmation email...'}
        </p>

        {/* Manual Redirect Button */}
        <button
          onClick={() => window.location.href = 'https://instakeysupply.com/'}
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