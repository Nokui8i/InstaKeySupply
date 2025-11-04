'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '../components/ProductCard';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoc(doc(db, 'wishlists', user.uid)).then(async snap => {
      const ids = snap.exists() ? (snap.data().items || []) : [];
      setWishlist(ids);
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      // Fetch all products by ID
      const productDocs = await Promise.all(ids.map((id: string) => getDoc(doc(db, 'products', id))));
      setProducts(productDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [user]);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'wishlists', user.uid), { items: arrayRemove(productId) });
      setWishlist(wishlist.filter(id => id !== productId));
      setProducts(products.filter(p => p.id !== productId));
    } catch (e) {
      // Optionally show error
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">
        <h1 className="text-2xl font-bold mb-4 text-blue-900">Your Wishlist</h1>
        <p>Please log in to view your wishlist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-white/90 rounded-2xl shadow-2xl border border-blue-100 mt-8 mb-24">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Your Wishlist</h1>
      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-400 py-16">Your wishlist is empty.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="relative group">
              <ProductCard
                id={product.id}
                image={product.images?.[0] || product.imageUrl || '/sample-key-1.png'}
                title={product.title}
                model={product.model}
                price={product.price}
                oldPrice={product.oldPrice}
                isOem={product.isOem}
              />
              <button
                className="absolute top-2 right-2 bg-white/80 hover:bg-red-100 text-red-600 rounded-full p-1 shadow transition-opacity opacity-0 group-hover:opacity-100"
                title="Remove from wishlist"
                onClick={() => handleRemove(product.id)}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 