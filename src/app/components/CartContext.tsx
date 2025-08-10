'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  stock: number;
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

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored cart:', e);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  const addToCart = (item: CartItem, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock) }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.stock) }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQuantity = (id: string, quantity: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i));
  const clearCart = () => setCart([]);

  const calculateShipping = async () => {
    try {
      if (cart.length === 0) {
        setShippingInfo(null);
        return;
      }

      const { getShippingCost } = await import('../../lib/shipping');
      const shippingCost = await getShippingCost();
      
      if (shippingCost > 0) {
        setShippingInfo({
          cost: shippingCost
        });
      } else {
        setShippingInfo(null);
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      setShippingInfo(null);
    }
  };

  // Calculate shipping when cart changes
  useEffect(() => {
    if (hydrated && cart.length > 0) {
      calculateShipping();
    } else {
      setShippingInfo(null);
    }
  }, [cart, hydrated]);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      hydrated,
      shippingInfo,
      setShippingInfo,
      calculateShipping
    }}>
      {children}
    </CartContext.Provider>
  );
}; 