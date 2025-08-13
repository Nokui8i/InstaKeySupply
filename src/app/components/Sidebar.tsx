"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBagIcon, 
  UserIcon, 
  HeartIcon, 
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  parentName?: string;
  isSubcategory: boolean;
}

interface CategoryTreeItemProps {
  category: Category;
  allCategories: Category[];
  level?: number;
  onClose: () => void;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function CategoryTreeItem({ category, allCategories, level = 0, onClose }: CategoryTreeItemProps) {
  const subcategories = allCategories.filter(cat => cat.parentId === category.id);
  const [expanded, setExpanded] = useState(false);

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (subcategories.length > 0) {
      setExpanded(!expanded);
    } else {
      // Navigate to the category page using category ID
      window.location.href = `/category/${category.id}`;
      onClose();
    }
  };

  return (
    <div>
             <div 
         className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${level > 0 ? 'ml-4' : ''}`}
         onClick={handleCategoryClick}
       >
                 <div className="flex items-center gap-3 flex-1 text-sm font-normal text-gray-700 hover:text-gray-900 transition-colors">
           <span className="text-gray-700">{category.name}</span>
         </div>
        
                 {subcategories.length > 0 && (
           <ChevronRightIcon 
             className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} 
           />
         )}
      </div>

             {expanded && subcategories.length > 0 && (
         <div className="ml-4">
          {subcategories.map((subcategory) => (
            <CategoryTreeItem
              key={subcategory.id}
              category={subcategory}
              allCategories={allCategories}
              level={level + 1}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesQuery = query(collection(db, "categories"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(categoriesQuery);
        const categoriesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isSubcategory: !!data.parentId
          } as Category;
        });
        setCategories(categoriesData);
        console.log('Sidebar categories from categories collection:', categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[9999] sidebar-content transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">IK</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">InstaKey Supply</h2>
              {user ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Signed in</p>
                  <button 
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={onClose}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* User Profile Section - When Logged In */}
          {user && (
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Welcome back, {user.email?.split('@')[0] || 'User'}!
              </h3>
              <div className="space-y-2">
                <Link 
                  href="/wishlist" 
                  className="flex items-center gap-3 p-3 text-gray-700 rounded-lg hover:bg-white/50 transition-colors"
                  onClick={onClose}
                >
                  <HeartIcon className="w-5 h-5 text-pink-600" />
                  <span className="text-sm font-medium">My Wishlist</span>
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="flex items-center gap-3 w-full p-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left"
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Admin Panel Section - Only show if user is admin */}
          {user && (
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Admin
              </h3>
              <Link 
                href="/admin" 
                className="flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                onClick={onClose}
              >
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Admin Panel</span>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link 
                href="/cart" 
                className="flex items-center gap-3 p-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Shopping Cart</span>
                {cartCount > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link 
                href="/wishlist" 
                className="flex items-center gap-3 p-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <HeartIcon className="w-5 h-5 text-pink-600" />
                <span className="text-sm font-medium">Wishlist</span>
              </Link>
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="p-4 space-y-2 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-1">
                {categories
                  .filter(cat => !cat.isSubcategory)
                  .map((category) => (
                    <CategoryTreeItem
                      key={category.id}
                      category={category}
                      allCategories={categories}
                      onClose={onClose}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 