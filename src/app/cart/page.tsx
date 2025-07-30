"use client";
import React from "react";
import { useCart } from "../components/CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, hydrated } = useCart();
  const router = useRouter();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
    <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-white/90 rounded-2xl shadow-2xl border border-blue-100 mt-8 mb-24">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Your Cart</h1>
      {cart.length === 0 ? (
        <div className="text-gray-500 text-center py-16">
          Your cart is empty.<br />
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold" onClick={() => router.push("/")}>Continue Shopping</button>
        </div>
      ) : (
        <>
          <table className="w-full mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-center">Quantity</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-2 flex items-center gap-3">
                    <Image src={item.imageUrl} alt={item.title} width={48} height={48} className="rounded border" />
                    <span>{item.title}</span>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      onChange={e => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-16 border rounded px-2 py-1 text-center"
                    />
                  </td>
                  <td className="p-2 text-right">${item.price.toFixed(2)}</td>
                  <td className="p-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                  <td className="p-2 text-right">
                    <button className="text-red-500 hover:underline" onClick={() => removeFromCart(item.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center mb-6">
            <button className="text-gray-500 hover:underline" onClick={clearCart}>Clear Cart</button>
            <div className="text-xl font-bold">Total: ${total.toFixed(2)}</div>
          </div>
          <button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-full shadow-md transition-all duration-200 text-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-300"
            onClick={() => router.push("/checkout")}
          >
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
} 