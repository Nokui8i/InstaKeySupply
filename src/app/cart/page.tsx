"use client";
import React, { useEffect, useState } from "react";
import { useCart } from "../components/CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, shippingInfo, calculateShipping, testUpdate, version, manualSave, directUpdate, resetCart, addTestItem } = useCart();
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [total, setTotal] = useState(0);
  const [testCounter, setTestCounter] = useState(0);
  const router = useRouter();

  // Debug: log cart changes
  useEffect(() => {
    console.log('CartPage: Cart changed:', cart);
    console.log('CartPage: Cart items with quantities:', cart.map(item => ({ id: item.id, title: item.title, quantity: item.quantity })));
    console.log('CartPage: Cart version:', version);
  }, [cart, version]);

  // Debug: log component render
  console.log('CartPage: Component rendering with cart:', cart);
  console.log('CartPage: Cart items:', cart.map(item => ({ id: item.id, quantity: item.quantity })));

  useEffect(() => {
    const calculate = () => {
      const newSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setSubtotal(newSubtotal);
      const newShippingCost = shippingInfo?.cost || 0;
      setShippingCost(newShippingCost);
      const newTotal = newSubtotal + newShippingCost;
      setTotal(newTotal);
    };
    calculate();
  }, [cart, shippingInfo]);

  if (!shippingInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
        <span className="text-gray-500 ml-4">Loading shipping info...</span>
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

      {/* Test Button for Debugging */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Controls</h3>
        <div className="space-y-2">
          <p className="text-sm text-yellow-700">
            <strong>Cart Version:</strong> {version} | <strong>Cart Items:</strong> {cart.length} | <strong>Total Quantity:</strong> {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
          <button
            onClick={() => {
              if (cart.length > 0) {
                const firstItem = cart[0];
                console.log('Test: Updating quantity for first item:', firstItem);
                updateQuantity(firstItem.id, firstItem.quantity + 1);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test: Increase First Item Quantity
          </button>
          <button
            onClick={() => {
              setTestCounter(prev => prev + 1);
              console.log('Test: Incrementing test counter');
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test: Increment Counter ({testCounter})
          </button>
          <button
            onClick={() => {
              console.log('Test: Calling CartContext testUpdate');
              testUpdate();
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test: CartContext Update
          </button>
          <button
            onClick={() => {
              console.log('Test: Manual save triggered');
              manualSave();
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Test: Manual Save
          </button>
          <button
            onClick={() => {
              if (cart.length > 0) {
                const firstItem = cart[0];
                console.log('Test: Direct update for first item:', firstItem);
                directUpdate(firstItem.id, firstItem.quantity + 1);
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Test: Direct Update
          </button>
          <button
            onClick={() => {
              console.log('Test: Resetting cart');
              resetCart();
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Test: Reset Cart
          </button>
          <button
            onClick={() => {
              console.log('Test: Adding test item');
              addTestItem();
            }}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Test: Add Test Item
          </button>
          <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
            Current cart state: {JSON.stringify(cart.map(item => ({ id: item.id, quantity: item.quantity })))}
          </div>
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
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        type="button"
                        onClick={() => {
                          const newQuantity = Math.max(1, item.quantity - 1);
                          console.log('Decreasing quantity for item:', item.id, 'from', item.quantity, 'to', newQuantity);
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
                          console.log('Increasing quantity for item:', item.id, 'from', item.quantity, 'to', newQuantity);
                          updateQuantity(item.id, newQuantity);
                        }}
                        className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
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
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            type="button"
                            onClick={() => {
                              const newQuantity = Math.max(1, item.quantity - 1);
                              console.log('Desktop: Decreasing quantity for item:', item.id, 'from', item.quantity, 'to', newQuantity);
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
                              console.log('Desktop: Increasing quantity for item:', item.id, 'from', item.quantity, 'to', newQuantity);
                              updateQuantity(item.id, newQuantity);
                            }}
                            className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
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
              <div className="flex gap-2">
                <button 
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
                  onClick={() => router.push("/")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Cart
                </button>
                {cart.length > 0 && (
                  <button 
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    onClick={() => {
                      const firstItem = cart[0];
                      if (firstItem) {
                        console.log('Test: Updating quantity for first item from', firstItem.quantity, 'to', firstItem.quantity + 1);
                        updateQuantity(firstItem.id, firstItem.quantity + 1);
                      }
                    }}
                  >
                    Test Quantity Update
                  </button>
                )}
              </div>
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