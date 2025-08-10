'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

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
  const { user } = useAuth();

  // Save cart to Firestore when user is logged in
  const saveCartToFirestore = async (cartData: CartItem[]) => {
    if (!user?.uid) return;
    
    try {
      const userCartRef = doc(db, 'userCarts', user.uid);
      await setDoc(userCartRef, {
        items: cartData,
        updatedAt: new Date().toISOString(),
        userId: user.uid
      });
      console.log('CartContext: Cart saved to Firestore for user:', user.uid);
    } catch (error) {
      console.error('CartContext: Failed to save cart to Firestore:', error);
    }
  };

  // Load cart from Firestore when user is logged in
  const loadCartFromFirestore = async () => {
    if (!user?.uid) return;
    
    try {
      const userCartRef = doc(db, 'userCarts', user.uid);
      const cartDoc = await getDoc(userCartRef);
      
      if (cartDoc.exists()) {
        const cartData = cartDoc.data();
        if (cartData.items && Array.isArray(cartData.items)) {
          console.log('CartContext: Cart loaded from Firestore:', cartData.items);
          setCart(cartData.items);
          return true;
        }
      }
    } catch (error) {
      console.error('CartContext: Failed to load cart from Firestore:', error);
    }
    return false;
  };

  // Listen to real-time cart updates from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const userCartRef = doc(db, 'userCarts', user.uid);
    const unsubscribe = onSnapshot(userCartRef, (doc) => {
      if (doc.exists()) {
        const cartData = doc.data();
        if (cartData.items && Array.isArray(cartData.items)) {
          console.log('CartContext: Real-time cart update from Firestore:', cartData.items);
          setCart(cartData.items);
        }
      }
    }, (error) => {
      console.error('CartContext: Firestore listener error:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Load cart from localStorage or Firestore
  useEffect(() => {
    console.log('CartContext: useEffect for cart loading triggered, user:', user?.uid);
    
    const loadCart = async () => {
      if (user?.uid) {
        // User is logged in - try to load from Firestore first
        console.log('CartContext: User logged in, loading from Firestore');
        const loadedFromFirestore = await loadCartFromFirestore();
        
        if (!loadedFromFirestore) {
          // If no Firestore cart, try to load from localStorage and migrate it
          const stored = localStorage.getItem('cart');
          if (stored) {
            try {
              const parsedCart = JSON.parse(stored);
              if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                console.log('CartContext: Migrating localStorage cart to Firestore:', parsedCart);
                setCart(parsedCart);
                await saveCartToFirestore(parsedCart);
                // Clear localStorage after migration
                localStorage.removeItem('cart');
              }
            } catch (e) {
              console.error('CartContext: Failed to parse stored cart:', e);
            }
          }
        }
      } else {
        // User is not logged in - load from localStorage
        console.log('CartContext: No user, loading from localStorage');
        const stored = localStorage.getItem('cart');
        
        if (stored) {
          try {
            const parsedCart = JSON.parse(stored);
            console.log('CartContext: Parsed cart from localStorage:', parsedCart);
            
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
      }
      setHydrated(true);
      console.log('CartContext: Hydrated set to true');
    };

    loadCart();
  }, [user?.uid]);

  // Save cart to appropriate storage when cart changes
  useEffect(() => {
    if (!hydrated) return;

    if (user?.uid) {
      // User is logged in - save to Firestore
      saveCartToFirestore(cart);
    } else {
      // User is not logged in - save to localStorage
      localStorage.setItem('cart', JSON.stringify(cart));
    }
    
    console.log('CartContext: Cart saved, current cart:', cart);
  }, [cart, user?.uid, hydrated]);

  const addToCart = (item: CartItem, quantity = 1) => {
    console.log('CartContext: addToCart called with:', { item, quantity });
    
    setCart(prev => {
      const existingItemIndex = prev.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex > -1) {
        // Item already exists, update quantity
        const updated = [...prev];
        updated[existingItemIndex] = {
          ...updated[existingItemIndex],
          quantity: updated[existingItemIndex].quantity + quantity
        };
        console.log('CartContext: Updated existing item quantity:', updated[existingItemIndex]);
        return updated;
      } else {
        // Item doesn't exist, add new item
        const newItem = { ...item, quantity };
        console.log('CartContext: Added new item to cart:', newItem);
        return [...prev, newItem];
      }
    });
  };

  const removeFromCart = (id: string) => {
    console.log('CartContext: removeFromCart called with id:', id);
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    console.log('CartContext: updateQuantity called with:', { id, quantity });
    
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      );
      console.log('CartContext: Updated cart with new quantity:', updated);
      return updated;
    });
    
    // Force re-render by incrementing version
    setVersion(prev => prev + 1);
  };

  const clearCart = () => {
    console.log('CartContext: clearCart called');
    setCart([]);
  };

  // Debug functions (keeping for now but can be removed later)
  const testUpdate = () => {
    console.log('CartContext: testUpdate called');
    setVersion(prev => prev + 1);
  };

  const manualSave = () => {
    console.log('CartContext: manualSave called');
    if (user?.uid) {
      saveCartToFirestore(cart);
    } else {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  };

  const directUpdate = (id: string, newQuantity: number) => {
    console.log('CartContext: directUpdate called with:', { id, newQuantity });
    updateQuantity(id, newQuantity);
  };

  const resetCart = () => {
    console.log('CartContext: resetCart called');
    setCart([]);
    setVersion(0);
  };

  const addTestItem = () => {
    console.log('CartContext: addTestItem called');
    const testItem: CartItem = {
      id: 'test-' + Date.now(),
      title: 'Test Item',
      price: 9.99,
      imageUrl: '/test-image.jpg',
      quantity: 1
    };
    addToCart(testItem);
  };

  const calculateShipping = async () => {
    // This function can be implemented later if needed
    console.log('CartContext: calculateShipping called');
  };

  const value: CartContextType = {
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
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 