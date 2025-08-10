'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
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
        const parsedCart = JSON.parse(stored);
        console.log('CartContext: Loading cart from localStorage:', parsedCart);
        setCart(parsedCart);
      } catch (e) {
        console.error('Failed to parse stored cart:', e);
      }
    } else {
      console.log('CartContext: No stored cart found, starting with empty cart');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      console.log('CartContext: Saving cart to localStorage:', cart);
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  const addToCart = (item: CartItem, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        // If item already exists, add to existing quantity
        const newQuantity = Math.min(existing.quantity + quantity, item.stock);
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: newQuantity }
            : i
        );
      }
      // If item doesn't exist, add new item with specified quantity
      return [...prev, { ...item, quantity: Math.min(quantity, item.stock) }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    console.log('CartContext: updateQuantity called:', { id, quantity, currentCart: cart });
    
    setCart(prev => {
      const updated = prev.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) }
          : item
      );
      console.log('CartContext: Cart updated:', { previous: prev, updated });
      return updated;
    });
  };
  const clearCart = () => setCart([]);

  const calculateShipping = async () => {
    try {
      if (cart.length === 0) {
        setShippingInfo(null);
        return;
      }

      console.log('Calculating shipping for cart:', cart.length, 'items');
      const { getShippingCost } = await import('../../lib/shipping');
      const shippingCost = await getShippingCost();
      
      console.log('Shipping cost calculated:', shippingCost);
      
      if (shippingCost > 0) {
        setShippingInfo({
          cost: shippingCost
        });
        console.log('Shipping info set:', { cost: shippingCost });
      } else {
        setShippingInfo(null);
        console.log('No shipping cost, shipping info cleared');
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