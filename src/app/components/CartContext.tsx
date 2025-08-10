'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { initCart, addToCart as addToCartManager, removeFromCart as removeFromCartManager, clearCart as clearCartManager, updateQuantity as updateQuantityManager } from '../../cartManager';
import { getShippingCost } from '../../lib/shipping';

interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface ShippingInfo {
  cost: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  hydrated: boolean;
  shippingInfo: ShippingInfo | null;
  setShippingInfo: (info: ShippingInfo | null) => void;
  calculateShipping: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  
  const { user } = useAuth();

  // Initialize cart manager on component mount
  useEffect(() => {
    const handleCartUpdate = (newCart: CartItem[]) => {
      setCart(newCart);
      setHydrated(true);
    };

    // Initialize the cart manager
    initCart(handleCartUpdate);
  }, []);

  const addToCart = async (item: CartItem, quantity = 1) => {
    const itemWithQuantity = { ...item, quantity };
    await addToCartManager(itemWithQuantity);
  };

  const removeFromCart = async (id: string) => {
    await removeFromCartManager(id);
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCartManager(id);
      return;
    }
    await updateQuantityManager(id, newQuantity);
  };

  const clearCart = async () => {
    await clearCartManager();
  };

  const calculateShipping = async () => {
    try {
      const shippingCost = await getShippingCost();
      // If no shipping cost is configured, use a default
      const finalShippingCost = shippingCost > 0 ? shippingCost : 5.99; // Default $5.99
      setShippingInfo({ cost: finalShippingCost });
      console.log('CartContext: Shipping cost calculated:', finalShippingCost);
    } catch (error) {
      console.error('CartContext: Error calculating shipping:', error);
      // Set default shipping cost on error
      setShippingInfo({ cost: 5.99 });
    }
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    hydrated,
    shippingInfo,
    setShippingInfo,
    calculateShipping
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 