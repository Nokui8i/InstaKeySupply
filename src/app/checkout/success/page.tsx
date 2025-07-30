"use client";
import React, { useEffect, useState, Suspense } from 'react';

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../components/CartContext';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Clear cart immediately
      clearCart();
      
      // Fetch order details
      fetchOrderDetails();
    } else {
      setError('No session ID found');
      setLoading(false);
    }
  }, [sessionId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/order-details?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (err) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Processing your payment...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/checkout')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FaCheckCircle className="text-3xl text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for your purchase. Your order has been confirmed.</p>
        </div>

        {/* Order Summary */}
        {orderDetails && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              {/* Order ID */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {orderDetails.id}
                </span>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Customer Information</h3>
                  <p className="text-gray-600">{orderDetails.customer?.name}</p>
                  <p className="text-gray-600">{orderDetails.customer?.email}</p>
                  <p className="text-gray-600">{orderDetails.customer?.phone}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Shipping Address</h3>
                  <p className="text-gray-600">{orderDetails.address?.street}</p>
                  <p className="text-gray-600">
                    {orderDetails.address?.city}, {orderDetails.address?.state} {orderDetails.address?.zip}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Items Ordered</h3>
                <div className="space-y-2">
                  {orderDetails.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800">{item.title}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">${orderDetails.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">What's Next?</h2>
          <div className="space-y-3 text-gray-600">
            <p>• You'll receive an order confirmation email shortly</p>
            <p>• We'll process your order and ship it within 1-2 business days</p>
            <p>• You'll receive tracking information once your order ships</p>
            <p>• If you have any questions, please contact our support team</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
} 