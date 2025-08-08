"use client";
import React, { useState, useEffect } from 'react';
import { useCart } from '../components/CartContext';

export default function TestStripePage() {
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cart } = useCart();

  useEffect(() => {
    testStripeConnection();
  }, []);

  const testStripeConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/test-stripe');
      const data = await response.json();
      
      setStripeStatus(data);
    } catch (err) {
      setError('Failed to test Stripe connection');
      console.error('Stripe test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a test checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: 'test-item-1',
              title: 'Test Car Key',
              price: 29.99,
              quantity: 1,
              imageUrl: '/sample-key-1.png',
              model: 'Test Model',
            }
          ],
          customerInfo: {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '+1234567890',
            address: {
              street: '123 Test St',
              city: 'Test City',
              state: 'CA',
              zip: '12345',
              country: 'United States'
            }
          },
          promoDiscount: 0,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Failed to create test order');
      console.error('Test order error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p>Testing Stripe connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Stripe Sandbox Testing</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {stripeStatus && (
        <div className="space-y-6">
          {/* Stripe Status */}
          <div className={`p-6 rounded-lg border ${
            stripeStatus.status === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h2 className="text-xl font-semibold mb-4">Stripe Configuration Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Status:</strong> {stripeStatus.status}</p>
                <p><strong>Message:</strong> {stripeStatus.message}</p>
                <p><strong>Sandbox Mode:</strong> {stripeStatus.sandboxMode ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Environment:</strong> {stripeStatus.configuration?.environment}</p>
              </div>
              <div>
                <p><strong>Secret Key:</strong> {stripeStatus.configuration?.hasSecretKey ? '✅ Configured' : '❌ Missing'}</p>
                <p><strong>Publishable Key:</strong> {stripeStatus.configuration?.hasPublishableKey ? '✅ Configured' : '❌ Missing'}</p>
                <p><strong>Webhook Secret:</strong> {stripeStatus.configuration?.hasWebhookSecret ? '✅ Configured' : '❌ Missing'}</p>
              </div>
            </div>
          </div>

          {/* Test Cards */}
          {stripeStatus.sandboxMode && stripeStatus.sandboxTestingInfo && (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Sandbox Test Cards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Successful Payments:</h3>
                  <ul className="space-y-1 text-sm">
                    <li><code>4242424242424242</code> - Visa (success)</li>
                    <li><code>5555555555554444</code> - Mastercard (success)</li>
                    <li><code>2223003122003222</code> - Mastercard (success)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Failed Payments:</h3>
                  <ul className="space-y-1 text-sm">
                    <li><code>4000000000000002</code> - Visa (declined)</li>
                    <li><code>4000000000009995</code> - Visa (insufficient funds)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-100 rounded">
                <p className="text-sm"><strong>Test Details:</strong></p>
                <p className="text-sm">Expiry: {stripeStatus.sandboxTestingInfo.testExpiryDate}</p>
                <p className="text-sm">CVC: {stripeStatus.sandboxTestingInfo.testCVC}</p>
                <p className="text-sm">ZIP: {stripeStatus.sandboxTestingInfo.testZipCode}</p>
              </div>
            </div>
          )}

          {/* Webhook Info */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Webhook Configuration</h2>
            <p className="mb-2"><strong>Webhook Endpoint:</strong></p>
            <code className="bg-gray-100 p-2 rounded block text-sm break-all">
              {stripeStatus.webhookEndpoint}
            </code>
            <p className="text-sm text-gray-600 mt-2">
              Configure this URL in your Stripe Dashboard → Webhooks
            </p>
          </div>

          {/* Test Order Button */}
          <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Payment Flow</h2>
            <p className="mb-4">Click the button below to create a test order and go through the complete payment flow:</p>
            <button
              onClick={createTestOrder}
              disabled={loading || stripeStatus.status !== 'success'}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Creating Test Order...' : 'Create Test Order ($29.99)'}
            </button>
          </div>

          {/* Current Cart Info */}
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Current Cart Status</h2>
            <p><strong>Items in cart:</strong> {cart.length}</p>
            <p><strong>Total:</strong> ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</p>
            {cart.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold">Cart Items:</p>
                <ul className="text-sm space-y-1">
                  {cart.map((item, index) => (
                    <li key={index}>
                      {item.title} x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={testStripeConnection}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Refresh Stripe Status
        </button>
      </div>
    </div>
  );
}
