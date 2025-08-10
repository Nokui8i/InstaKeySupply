"use client";
import React from "react";
import { useCart } from "../components/CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, hydrated, shippingInfo } = useCart();
  const router = useRouter();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingInfo?.cost || 0;
  const total = subtotal + shippingCost;

  // Debug log
  console.log('CartPage render:', { cart, hydrated });

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
        <span className="text-gray-500 ml-4">Loading cart...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6 mb-4 sm:mb-6">
        <div className="mb-2 sm:mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {cart.length === 0 ? "Your cart is empty" : `${cart.length} item${cart.length !== 1 ? 's' : ''} in your cart`}
          </p>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</p>
            <p className="text-sm text-gray-600">Start shopping to add items to your cart</p>
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            onClick={() => router.push("/")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-3">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex gap-3 mb-3">
                  <div className="flex-shrink-0">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.title} 
                      width={60} 
                      height={60} 
                      className="rounded-lg border border-gray-200" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">${item.price.toFixed(2)} each</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Qty:</label>
                    <input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      onChange={e => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-sm"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cart.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Image 
                            src={item.imageUrl} 
                            alt={item.title} 
                            width={48} 
                            height={48} 
                            className="rounded border border-gray-200" 
                          />
                          <span className="text-sm font-medium text-gray-900">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={e => updateQuantity(item.id, parseInt(e.target.value))}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
              <button 
                className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
                onClick={clearCart}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Cart
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="text-lg font-medium text-gray-900">${subtotal.toFixed(2)}</p>
                {shippingInfo && (
                  <div className="mt-1">
                    <p className="text-sm text-gray-600">Shipping</p>
                    <p className="text-sm font-medium text-gray-700">${shippingCost.toFixed(2)}</p>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 text-base sm:text-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-300"
              onClick={() => router.push("/checkout")}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 