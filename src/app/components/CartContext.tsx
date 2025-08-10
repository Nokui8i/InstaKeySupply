'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock?: number;
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
  testUpdate: () => void;
  version: number;
  manualSave: () => void;
  directUpdate: (id: string, newQuantity: number) => void;
  resetCart: () => void;
  addTestItem: () => void;
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
  const [version, setVersion] = useState(0); // Force re-renders

  useEffect(() => {
    console.log('CartContext: useEffect for localStorage loading triggered');
    const stored = localStorage.getItem('cart');
    console.log('CartContext: Raw localStorage value:', stored);
    
    if (stored) {
      try {
        const parsedCart = JSON.parse(stored);
        console.log('CartContext: Parsed cart from localStorage:', parsedCart);
        
        // Validate the parsed cart data
        if (Array.isArray(parsedCart)) {
          const validatedCart = parsedCart.filter(item => 
            item && 
            item.id && 
            item.title && 
            typeof item.price === 'number' && 
            typeof item.quantity === 'number' &&
            item.quantity > 0
          );
          
          console.log('CartContext: Validated cart:', validatedCart);
          
          if (validatedCart.length !== parsedCart.length) {
            console.warn('CartContext: Some cart items were invalid and filtered out:', {
              original: parsedCart,
              validated: validatedCart
            });
          }
          
          setCart(validatedCart);
          console.log('CartContext: Cart state set to:', validatedCart);
        } else {
          console.warn('CartContext: Stored cart is not an array, clearing cart');
          setCart([]);
        }
      } catch (e) {
        console.error('CartContext: Failed to parse stored cart:', e);
        setCart([]);
      }
    } else {
      console.log('CartContext: No stored cart found, starting with empty cart');
    }
    setHydrated(true);
    console.log('CartContext: Hydrated set to true');
  }, []);

  useEffect(() => {
    if (hydrated) {
      console.log('CartContext: Saving cart to localStorage - hydrated:', hydrated, 'cart:', cart);
      const cartString = JSON.stringify(cart);
      console.log('CartContext: Cart stringified:', cartString);
      localStorage.setItem('cart', cartString);
      console.log('CartContext: Cart saved to localStorage successfully');
      
      // Verify the save
      const verify = localStorage.getItem('cart');
      console.log('CartContext: Verification - retrieved from localStorage:', verify);
    } else {
      console.log('CartContext: Not saving to localStorage - not hydrated yet');
    }
  }, [cart, hydrated]);

  const addToCart = (item: CartItem, quantity = 1) => {
    console.log('CartContext: addToCart called:', { item, quantity, currentCart: cart });
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        // If item already exists, add to existing quantity (no stock limit)
        const newQuantity = existing.quantity + quantity;
        const updated = prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: newQuantity }
            : i
        );
        console.log('CartContext: Item already exists, updated quantity:', { 
          existing: existing, 
          newQuantity, 
          updated: updated.find(i => i.id === item.id),
          allItems: updated.map(item => ({ id: item.id, quantity: item.quantity }))
        });
        return updated;
      }
      // If item doesn't exist, add new item with specified quantity (no stock limit)
      const newCart = [...prev, { ...item, quantity: quantity }];
      console.log('CartContext: New item added:', { 
        newItem: { ...item, quantity: quantity },
        allItems: newCart.map(item => ({ id: item.id, quantity: item.quantity }))
      });
      return newCart;
    });
    
    // Force re-render by incrementing version
    setVersion(prev => prev + 1);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
    // Force re-render by incrementing version
    setVersion(prev => prev + 1);
  };
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    console.log('CartContext: updateQuantity called:', { id, quantity, currentCart: cart });
    
    setCart(prev => {
      console.log('CartContext: updateQuantity setCart callback - prev state:', prev);
      
      const item = prev.find(i => i.id === id);
      if (!item) {
        console.warn('CartContext: Item not found for quantity update:', id);
        return prev;
      }
      
      console.log('CartContext: Found item to update:', item);
      
      // No stock limit - just ensure quantity is at least 1
      const validQuantity = Math.max(1, quantity);
      
      const updated = prev.map(item => 
        item.id === id 
          ? { ...item, quantity: validQuantity }
          : item
      );
      
      console.log('CartContext: Cart updated:', { 
        previous: prev, 
        updated,
        changedItem: updated.find(item => item.id === id),
        allItems: updated.map(item => ({ id: item.id, quantity: item.quantity }))
      });
      
      // Force a re-render by creating a new array reference
      const finalCart = [...updated];
      console.log('CartContext: Final cart state to be set:', finalCart);
      
      return finalCart;
    });
    
    // Force re-render by incrementing version
    setVersion(prev => prev + 1);
  };
  const clearCart = () => {
    setCart([]);
    // Force re-render by incrementing version
    setVersion(prev => prev + 1);
  };

  const testUpdate = () => {
    console.log('CartContext: testUpdate called');
    setCart(prev => {
      console.log('CartContext: testUpdate - current cart:', prev);
      if (prev.length > 0) {
        const updated = prev.map((item, index) => 
          index === 0 ? { ...item, quantity: item.quantity + 1 } : item
        );
        console.log('CartContext: testUpdate - updated cart:', updated);
        return updated;
      }
      return prev;
    });
    
    // Force re-render by incrementing version
    setVersion(prev => prev + 1);
  };

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

  // Manual save function for debugging
  const manualSave = () => {
    if (hydrated) {
      console.log('CartContext: Manual save triggered');
      const cartString = JSON.stringify(cart);
      localStorage.setItem('cart', cartString);
      console.log('CartContext: Manual save completed:', cartString);
    }
  };

  // Direct cart manipulation for debugging
  const directUpdate = (id: string, newQuantity: number) => {
    console.log('CartContext: directUpdate called:', { id, newQuantity, currentCart: cart });
    
    const updatedCart = cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    
    console.log('CartContext: directUpdate - updated cart:', updatedCart);
    setCart(updatedCart);
    setVersion(prev => prev + 1);
  };

  // Reset cart for debugging
  const resetCart = () => {
    console.log('CartContext: resetCart called');
    localStorage.removeItem('cart');
    setCart([]);
    setVersion(prev => prev + 1);
    console.log('CartContext: Cart reset completed');
  };

  // Add test item for debugging
  const addTestItem = () => {
    console.log('CartContext: addTestItem called');
    const testItem: CartItem = {
      id: 'test-item-' + Date.now(),
      title: 'Test Item',
      price: 9.99,
      imageUrl: '/placeholder.jpg',
      quantity: 1
    };
    
    console.log('CartContext: Adding test item:', testItem);
    setCart(prev => [...prev, testItem]);
    setVersion(prev => prev + 1);
    console.log('CartContext: Test item added');
  };

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
      calculateShipping,
      testUpdate,
      version,
      manualSave,
      directUpdate,
      resetCart,
      addTestItem
    }}>
      {children}
    </CartContext.Provider>
  );
}; 