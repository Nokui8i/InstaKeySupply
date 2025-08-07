"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, ChevronRightIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  parentName?: string;
  isSubcategory: boolean;
  createdAt: Date;
  productCount: number;
  order?: number;
}

interface Product {
  id: string;
  title: string;
  category?: string;
  categoryId?: string;
  price: string;
  imageUrl: string;
}

interface CategoryTreeItemProps {
  category: Category;
  allCategories: Category[];
  level?: number;
  onViewProducts: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (parentId: string, parentName: string) => void;
  dragHandleProps?: {
    attributes: any;
    listeners: any;
  };
}

interface SortableCategoryItemProps {
  category: Category;
  allCategories: Category[];
  onViewProducts: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (parentId: string, parentName: string) => void;
}

interface MobileCategoryCardProps {
  category: Category;
  allCategories: Category[];
  onViewProducts: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (parentId: string, parentName: string) => void;
}

function SortableCategoryItem({ 
  category, 
  allCategories, 
  onViewProducts, 
  onEdit, 
  onDelete, 
  onAddSubcategory 
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <CategoryTreeItem
        category={category}
        allCategories={allCategories}
        onViewProducts={onViewProducts}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddSubcategory={onAddSubcategory}
        dragHandleProps={{ attributes, listeners }}
      />
    </div>
  );
}

function CategoryTreeItem({ 
  category, 
  allCategories, 
  level = 0, 
  onViewProducts, 
  onEdit, 
  onDelete, 
  onAddSubcategory,
  dragHandleProps
}: CategoryTreeItemProps) {
  const subcategories = allCategories.filter(cat => cat.parentId === category.id);
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className={`flex items-center justify-between p-2 lg:p-4 hover:bg-gray-50 transition-colors ${level > 0 ? 'bg-gray-50 border-l-2 border-gray-200' : 'bg-white'}`}>
        <div className="flex items-center gap-2 lg:gap-3 flex-1">
          {dragHandleProps && (
            <button
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              className="p-0.5 lg:p-1 hover:bg-gray-200 rounded transition-colors cursor-grab active:cursor-grabbing"
            >
              <Bars3Icon className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
            </button>
          )}
          {subcategories.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 lg:p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <ChevronRightIcon 
                className={`w-3 h-3 lg:w-4 lg:h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} 
              />
            </button>
          )}
          {subcategories.length === 0 && !dragHandleProps && <div className="w-4 lg:w-6" />}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className={`font-medium text-xs lg:text-sm ${level > 0 ? 'text-gray-700' : 'text-gray-900'}`}>
                {category.name}
              </span>
              <span className="text-xs lg:text-sm text-gray-500 bg-gray-100 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded">
                {category.productCount} products
              </span>
              {level > 0 && (
                <span className="text-xs lg:text-sm bg-gray-200 text-gray-600 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded">
                  Subcategory
                </span>
              )}
            </div>
            {level > 0 && (
              <div className="text-xs lg:text-sm text-gray-500 mt-0.5 lg:mt-1">
                Under: {category.parentName}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onViewProducts(category)}
            className="px-2 py-0.5 lg:px-3 lg:py-1 text-xs lg:text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onEdit(category)}
            className="px-2 py-0.5 lg:px-3 lg:py-1 text-xs lg:text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(category)}
            className="px-2 py-0.5 lg:px-3 lg:py-1 text-xs lg:text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => onAddSubcategory(category.id, category.name)}
            className="px-2 py-0.5 lg:px-3 lg:py-1 text-xs lg:text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
          >
            Add Sub
          </button>
        </div>
      </div>

      {expanded && subcategories.length > 0 && (
        <div className="ml-4 lg:ml-6">
          {subcategories.map((subcategory) => (
            <CategoryTreeItem
              key={subcategory.id}
              category={subcategory}
              allCategories={allCategories}
              level={level + 1}
              onViewProducts={onViewProducts}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubcategory={onAddSubcategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileCategoryCard({ 
  category, 
  allCategories, 
  onViewProducts, 
  onEdit, 
  onDelete, 
  onAddSubcategory 
}: MobileCategoryCardProps) {
  const subcategories = allCategories.filter(cat => cat.parentId === category.id);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      {/* Main Category */}
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-xs">{category.name}</h3>
              <p className="text-xs text-gray-500">{category.productCount} product{category.productCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          {subcategories.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRightIcon 
                className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} 
              />
            </button>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onViewProducts(category)}
            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors text-xs"
          >
            View
          </button>
          <button
            onClick={() => onEdit(category)}
            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors text-xs"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(category)}
            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors text-xs"
          >
            Delete
          </button>
          <button
            onClick={() => onAddSubcategory(category.id, category.name)}
            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors text-xs"
          >
            Add Sub
          </button>
        </div>
      </div>

      {/* Subcategories */}
      {expanded && subcategories.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50">
          {subcategories.map((subcategory) => (
            <div key={subcategory.id} className="p-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 ml-1">
                    <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-xs">{subcategory.name}</h4>
                    <p className="text-xs text-gray-500">{subcategory.productCount} product{subcategory.productCount !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-400">Under: {subcategory.parentName}</p>
                  </div>
                </div>
              </div>
              
              {/* Subcategory Action Buttons */}
              <div className="flex flex-wrap gap-1 ml-6">
                <button
                  onClick={() => onViewProducts(subcategory)}
                  className="px-1.5 py-0.5 bg-white hover:bg-gray-50 text-gray-600 rounded border border-gray-200 transition-colors text-xs"
                >
                  View
                </button>
                <button
                  onClick={() => onEdit(subcategory)}
                  className="px-1.5 py-0.5 bg-white hover:bg-gray-50 text-gray-600 rounded border border-gray-200 transition-colors text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(subcategory)}
                  className="px-1.5 py-0.5 bg-white hover:bg-gray-50 text-gray-600 rounded border border-gray-200 transition-colors text-xs"
                >
                  Delete
                </button>
                <button
                  onClick={() => onAddSubcategory(subcategory.id, subcategory.name)}
                  className="px-1.5 py-0.5 bg-white hover:bg-gray-50 text-gray-600 rounded border border-gray-200 transition-colors text-xs"
                >
                  Add Sub
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    parentName: ''
  });

  useEffect(() => {
    // Test Firebase connection first
    const testFirebase = async () => {
      try {
        console.log('Testing Firebase connection...');
        const testRef = collection(db, 'categories');
        const testSnapshot = await getDocs(testRef);
        console.log('Firebase connection successful. Found', testSnapshot.docs.length, 'categories');
      } catch (error) {
        console.error('Firebase connection failed:', error);
      }
    };
    
    testFirebase();
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter parent categories (categories without parentId)
    const parents = categories.filter(cat => !cat.isSubcategory);
    setParentCategories(parents);
  }, [categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch categories...');
      
      const categoriesRef = collection(db, 'categories');
      // Simplified query - just get all categories without ordering first
      const snapshot = await getDocs(categoriesRef);
      
      console.log('Raw categories from Firebase:', snapshot.docs.length);
      
      const categoriesData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log('Category data:', doc.id, data);
          
          // Get product count for this category with error handling
          let productCount = 0;
          try {
            const productsRef = collection(db, 'products');
            const productsQuery = query(productsRef, where('categoryId', '==', doc.id));
            const productsSnapshot = await getDocs(productsQuery);
            productCount = productsSnapshot.size;
          } catch (productError) {
            console.warn(`Error fetching product count for category ${doc.id}:`, productError);
            productCount = 0;
          }
          
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            productCount: productCount,
            isSubcategory: !!data.parentId,
            order: data.order || 0
          } as Category;
        })
      );
      
      // Sort categories after fetching
      const sortedCategories = categoriesData.sort((a, b) => {
        // First sort by order
        if (a.order !== b.order) {
          return (a.order || 0) - (b.order || 0);
        }
        // Then by creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      console.log('Processed categories:', sortedCategories.length);
      console.log('Categories data:', sortedCategories);
      setCategories(sortedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Even if there's an error, try to fetch categories without product counts
      try {
        console.log('Trying fallback fetch...');
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        
        const fallbackCategories = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Fallback category data:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            productCount: 0,
            isSubcategory: !!data.parentId,
            order: data.order || 0
          } as Category;
        });
        
        // Sort fallback categories too
        const sortedFallbackCategories = fallbackCategories.sort((a, b) => {
          if (a.order !== b.order) {
            return (a.order || 0) - (b.order || 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log('Fallback categories fetched:', sortedFallbackCategories.length);
        setCategories(sortedFallbackCategories);
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCategories);

        // Update order in Firebase
        try {
          const updatePromises = newCategories.map((category, index) => {
            const categoryRef = doc(db, 'categories', category.id);
            return updateDoc(categoryRef, { order: index });
          });
          await Promise.all(updatePromises);
        } catch (error) {
          console.error('Error updating category order:', error);
        }
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('title'));
      const snapshot = await getDocs(q);
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddCategory = async () => {
    try {
      // Get the next order number for main categories
      const mainCategories = categories.filter(cat => !cat.isSubcategory);
      const nextOrder = mainCategories.length;

      // If parentId is set, create a subcategory
      if (formData.parentId) {
        const categoryData = {
          name: formData.name,
          parentId: formData.parentId,
          parentName: formData.parentName,
          isSubcategory: true,
          createdAt: new Date()
        };
        
        await addDoc(collection(db, 'categories'), categoryData);
      } else {
        // Create a main category
        const categoryData = {
          name: formData.name,
          parentId: null,
          parentName: null,
          isSubcategory: false,
          createdAt: new Date(),
          order: nextOrder
        };
        
        await addDoc(collection(db, 'categories'), categoryData);
      }
      
      setShowAddModal(false);
      setFormData({ name: '', parentId: '', parentName: '' });
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      const categoryRef = doc(db, 'categories', selectedCategory.id);
      const updateData = {
        name: formData.name,
        // Keep the existing parent relationship
        parentId: selectedCategory.parentId || null,
        parentName: selectedCategory.parentName || null,
        isSubcategory: selectedCategory.isSubcategory
      };
      
      await updateDoc(categoryRef, updateData);
      setShowEditModal(false);
      setSelectedCategory(null);
      setFormData({ name: '', parentId: '', parentName: '' });
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setLoading(true);
      
      // First, remove categoryId from all products in this category
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, where('categoryId', '==', selectedCategory.id));
      const productsSnapshot = await getDocs(productsQuery);
      
      const updatePromises = productsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { categoryId: null, category: null })
      );
      await Promise.all(updatePromises);
      
      // If this is a main category, also remove parentId from all subcategories
      if (!selectedCategory.isSubcategory) {
        const subcategoriesRef = collection(db, 'categories');
        const subcategoriesQuery = query(subcategoriesRef, where('parentId', '==', selectedCategory.id));
        const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
        
        const subcategoryUpdatePromises = subcategoriesSnapshot.docs.map(doc => 
          updateDoc(doc.ref, { parentId: null, parentName: null, isSubcategory: false })
        );
        await Promise.all(subcategoryUpdatePromises);
      }
      
      // Then delete the category
      await deleteDoc(doc(db, 'categories', selectedCategory.id));
      setShowDeleteModal(false);
      setSelectedCategory(null);
      
      // Refresh both categories and products
      await Promise.all([fetchCategories(), fetchProducts()]);
      
    } catch (error) {
      console.error('Error deleting category:', error);
      // Even if there's an error, try to refresh the categories
      try {
        await fetchCategories();
      } catch (refreshError) {
        console.error('Error refreshing categories after delete:', refreshError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewProducts = async (category: Category) => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('categoryId', '==', category.id));
      const snapshot = await getDocs(q);
      const categoryProductsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setCategoryProducts(categoryProductsData);
      setSelectedCategory(category);
      setShowProductsModal(true);
    } catch (error) {
      console.error('Error fetching category products:', error);
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId || '',
      parentName: category.parentName || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded border p-4">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Category Management</h1>
              <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1">Organize your products with categories and subcategories</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchCategories();
                }}
                disabled={loading}
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-2"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium"
              >
                <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Categories List */}
        <div className="lg:hidden p-2 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded border border-gray-200 p-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white rounded border border-gray-200 p-6 text-center">
              <div className="text-gray-300 mb-3">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-1 text-sm">No Categories Yet</p>
              <p className="text-gray-400 text-xs">Create your first category to organize your products</p>
            </div>
          ) : (
            categories
              .filter(cat => !cat.isSubcategory)
              .map((parentCategory) => (
                <MobileCategoryCard
                  key={parentCategory.id}
                  category={parentCategory}
                  allCategories={categories}
                  onViewProducts={handleViewProducts}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  onAddSubcategory={(parentId, parentName) => {
                    setFormData({ name: '', parentId, parentName });
                    setShowAddModal(true);
                  }}
                />
              ))
          )}
        </div>

        {/* Desktop Categories Tree */}
        <div className="hidden lg:block p-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
                <p className="text-base">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-base">No categories yet. Create your first category to get started.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.filter(cat => !cat.isSubcategory).map(cat => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {categories
                      .filter(cat => !cat.isSubcategory)
                      .map((parentCategory) => (
                        <SortableCategoryItem
                          key={parentCategory.id}
                          category={parentCategory}
                          allCategories={categories}
                          onViewProducts={handleViewProducts}
                          onEdit={openEditModal}
                          onDelete={openDeleteModal}
                          onAddSubcategory={(parentId, parentName) => {
                            setFormData({ name: '', parentId, parentName });
                            setShowAddModal(true);
                          }}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded max-w-xs sm:max-w-sm lg:max-w-md w-full p-4 sm:p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-base sm:text-lg lg:text-xl font-medium sm:font-semibold text-gray-900 mb-3 sm:mb-4">
                {formData.parentId ? 'Add Subcategory' : 'Add New Category'}
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                    placeholder={formData.parentId ? "e.g., Toyota Keys" : "e.g., Car Keys"}
                  />
                </div>

                {formData.parentId && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-gray-600">
                      <strong>Parent Category:</strong> {formData.parentName}
                    </p>
                  </div>
                )}

              </div>
             <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
               <button
                 onClick={() => setShowAddModal(false)}
                 className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
               >
                 Cancel
               </button>
               <button
                 onClick={handleAddCategory}
                 disabled={!formData.name.trim()}
                 className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
               >
                 {formData.parentId ? 'Add Subcategory' : 'Add Category'}
               </button>
             </div>
           </div>
         </div>
       )}

        {/* Edit Category Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3" onClick={() => setShowEditModal(false)}>
            <div className="bg-white rounded max-w-xs sm:max-w-sm lg:max-w-md w-full p-4 sm:p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-base sm:text-lg lg:text-xl font-medium sm:font-semibold text-gray-900 mb-3 sm:mb-4">
                {selectedCategory?.isSubcategory ? 'Edit Subcategory' : 'Edit Category'}
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                  />
                </div>

                {selectedCategory?.isSubcategory && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-gray-600">
                      <strong>Parent Category:</strong> {selectedCategory.parentName}
                    </p>
                  </div>
                )}

              </div>
             <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
               <button
                 onClick={() => setShowEditModal(false)}
                 className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
               >
                 Cancel
               </button>
               <button
                 onClick={handleEditCategory}
                 disabled={!formData.name.trim()}
                 className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
               >
                 Update Category
               </button>
             </div>
           </div>
         </div>
       )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3" onClick={() => setShowDeleteModal(false)}>
            <div className="bg-white rounded max-w-sm sm:max-w-md w-full p-4 sm:p-6" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <TrashIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                </div>
                <h2 className="text-base sm:text-lg lg:text-xl font-medium sm:font-semibold mb-1 sm:mb-2">Delete Category</h2>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Are you sure you want to delete "{selectedCategory?.name}"? This will remove the category from all associated products.
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs sm:text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Products Modal */}
        {showProductsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3" onClick={() => setShowProductsModal(false)}>
            <div className="bg-white rounded max-w-3xl sm:max-w-4xl lg:max-w-5xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-base sm:text-lg lg:text-xl font-medium sm:font-semibold text-gray-900">Products in {selectedCategory?.name}</h2>
                  <button
                    onClick={() => setShowProductsModal(false)}
                    className="p-1 sm:p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[65vh]">
                {categoryProducts.length > 0 ? (
                  <div className="p-3 sm:p-4 lg:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {categoryProducts.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <img 
                              src={product.imageUrl} 
                              alt={product.title}
                              className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{product.title}</h3>
                              <p className="text-xs sm:text-sm lg:text-base text-gray-500">${product.price}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 text-center text-gray-500">
                    <div className="text-gray-300 mb-3 sm:mb-4">
                      <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-base sm:text-lg lg:text-xl font-medium sm:font-semibold mb-1 sm:mb-2">No Products Found</p>
                    <p className="text-xs sm:text-sm lg:text-base">No products in this category yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 