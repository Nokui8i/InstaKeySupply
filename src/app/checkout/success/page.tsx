"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../components/CartContext';
import { FaCheckCircle, FaExclamationTriangle, FaShoppingCart, FaList } from 'react-icons/fa';

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic';

interface OrderDetails {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: Array<{
    title: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }>;
  total: number;
  subtotal: number;
  promoDiscount: number;
  payment_status: string;
  stripeSessionId: string;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderDetailsError, setOrderDetailsError] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Clear cart immediately
      clearCart();
      fetchOrderDetails(sessionId);
      // Send email as fallback
      sendOrderEmail(sessionId);
    } else {
      setLoading(false);
    }
  }, [searchParams, clearCart]);

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/order-details?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      } else {
        console.error('Error fetching order details:', response.status);
        setOrderDetailsError(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setOrderDetailsError(true);
    } finally {
      setLoading(false);
    }
  };

  const sendOrderEmail = async (sessionId: string) => {
    try {
      // First try to get order details to send email
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

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <FaCheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for your purchase. Your order has been confirmed.</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          {orderDetails ? (
            <>
              <div className="mb-4">
                <span className="text-sm text-gray-500">Order ID:</span>
                <div className="bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-700">
                  {orderDetails.id}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                  <p className="text-gray-700">{orderDetails.customer.name}</p>
                  <p className="text-gray-700">{orderDetails.customer.email}</p>
                  <p className="text-gray-700">{orderDetails.customer.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                  <p className="text-gray-700">{formatAddress(orderDetails.address)}</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Items Ordered</h3>
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <p className="text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-green-600">${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : orderDetailsError ? (
            <div className="text-center py-8">
              <FaExclamationTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Your payment was successful and your order has been created!</p>
              <p className="text-sm text-gray-500">Order details are being processed and will be available shortly.</p>
              <div className="mt-4">
                <span className="text-sm text-gray-500">Session ID:</span>
                <div className="bg-gray-100 px-3 py-2 rounded text-sm font-mono text-blue-600">
                  {searchParams.get('session_id')}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading order details...</p>
            </div>
          )}
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              {emailSent ? 'Order confirmation email sent!' : 'You\'ll receive an order confirmation email shortly'}
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">→</span>
              We'll process your order and ship it within 1-2 business days
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">→</span>
              You'll receive tracking information once your order ships
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">→</span>
              If you have any questions, please contact our support team
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <FaShoppingCart className="mr-2" />
            Continue Shopping
          </button>
          <button
            onClick={() => router.push('/admin/orders')}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors flex items-center justify-center"
          >
            <FaList className="mr-2" />
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
} 