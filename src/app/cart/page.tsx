'use client';

import { useCart } from '../components/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const calculateTotals = async () => {
      const newSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setSubtotal(newSubtotal);

      try {
        const response = await fetch('/api/shipping-cost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subtotal: newSubtotal }),
        });

        if (response.ok) {
          const data = await response.json();
          setShippingCost(data.shippingCost);
          setTotal(newSubtotal + data.shippingCost);
        } else {
          setShippingCost(0);
          setTotal(newSubtotal);
        }
      } catch (error) {
        console.error('Error fetching shipping cost:', error);
        setShippingCost(0);
        setTotal(newSubtotal);
      }
    };

    calculateTotals();
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
            <p className="text-gray-600 mb-8">Your cart is empty</p>
            <button
              onClick={() => router.push('/products')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
        <p className="text-gray-600 mb-8">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {cart.map((item) => (
              <div key={item.id} className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Qty:</label>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          type="button"
                          onClick={() => {
                            const newQuantity = Math.max(1, item.quantity - 1);
                            updateQuantity(item.id, newQuantity);
                          }}
                          className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-sm px-2 py-1 bg-gray-50">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newQuantity = item.quantity + 1;
                            updateQuantity(item.id, newQuantity);
                          }}
                          className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={clearCart}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear Cart
                </button>
              </div>

              <div className="text-right">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleCheckout}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
} 