'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
}

export interface ShippingInfo {
  cost: number;
  name: string;
  description: string;
  region?: string;
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
  calculateShipping: (region?: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    console.log('CartProvider localStorage.getItem:', stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCart(parsed);
        console.log('CartProvider hydrated cart:', parsed);
      } catch (e) {
        console.error('CartProvider JSON.parse error:', e);
      }
    }
    setHydrated(true);
    // Multi-tab sync
    const sync = (e: StorageEvent) => {
      if (e.key === 'cart') {
        setCart(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Only write to localStorage after hydration
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('cart', JSON.stringify(cart));
      console.log('CartProvider localStorage.setItem:', JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  // Debug log
  console.log('CartProvider render:', { cart, hydrated });

  const addToCart = (item: CartItem, quantity = 1) => {
    console.log('addToCart called:', { item, quantity });
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock) } : i);
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.stock) }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQuantity = (id: string, quantity: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i));
  const clearCart = () => setCart([]);

  const calculateShipping = async (region?: string) => {
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (total === 0) {
        setShippingInfo(null);
        return;
      }

      const { calculateShippingCost } = await import('../../lib/shipping');
      const shippingCalculation = await calculateShippingCost(total, region);
      
      if (shippingCalculation) {
        setShippingInfo({
          cost: shippingCalculation.cost,
          name: shippingCalculation.name,
          description: shippingCalculation.description,
          region
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