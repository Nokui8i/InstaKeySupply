"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../components/CartContext';
import { FaCheckCircle, FaShoppingCart } from 'react-icons/fa';

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic';

// Helper function to get the current base URL dynamically
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Use the current protocol and domain
    return `${window.location.protocol}//${window.location.host}`;
  }
  // Fallback for SSR
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://instakeysupply.com';
};

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      clearCart();
      
      // Send email as fallback
      sendOrderEmail(sessionId);
      
      // Redirect to main page after 2 seconds using dynamic URL
      const timer = setTimeout(() => {
        console.log('Redirecting to main page...');
        const baseUrl = getBaseUrl();
        window.location.href = `${baseUrl}/`;
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // No session ID, redirect immediately
      console.log('No session ID, redirecting immediately...');
      const baseUrl = getBaseUrl();
      window.location.href = `${baseUrl}/`;
    }
  }, [searchParams, clearCart]);

  const sendOrderEmail = async (sessionId: string) => {
    try {
      console.log('Attempting to send order email for session:', sessionId);
      
      // Get order details first
      const orderResponse = await fetch(`/api/order-details?session_id=${sessionId}`);
      console.log('Order details response status:', orderResponse.status);
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        console.log('Order data received:', { 
          customerEmail: orderData.customer?.email, 
          orderId: orderData.id,
          total: orderData.total 
        });
        
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

        console.log('Email API response status:', emailResponse.status);
        
        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log('Order email sent successfully from success page:', emailResult);
          setEmailSent(true);
        } else {
          const errorText = await emailResponse.text();
          console.error('Failed to send order email from success page. Status:', emailResponse.status, 'Error:', errorText);
        }
      } else {
        console.error('Failed to get order details. Status:', orderResponse.status);
        const errorText = await orderResponse.text();
        console.error('Order details error:', errorText);
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
          Thank you for your purchase. Your order has been confirmed and you&apos;ll receive a confirmation email shortly.
        </p>
        
        {/* Email Status */}
        <p className="text-sm text-green-600 mb-8">
          {emailSent ? '✓ Email sent successfully!' : 'Sending confirmation email...'}
        </p>

        {/* Manual Redirect Button */}
        <button
          onClick={() => {
            const baseUrl = getBaseUrl();
            window.location.href = `${baseUrl}/`;
          }}
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