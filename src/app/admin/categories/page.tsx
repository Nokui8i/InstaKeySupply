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
      <div className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${level > 0 ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-white'}`}>
        <div className="flex items-center gap-3 flex-1">
          {dragHandleProps && (
            <button
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              className="p-1 hover:bg-gray-200 rounded transition-colors cursor-grab active:cursor-grabbing"
            >
              <Bars3Icon className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {subcategories.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <ChevronRightIcon 
                className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} 
              />
            </button>
          )}
          {subcategories.length === 0 && !dragHandleProps && <div className="w-6" />}
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${level > 0 ? 'text-blue-800' : 'text-gray-900'}`}>
                {category.name}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {category.productCount} products
              </span>
              {level > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Subcategory
                </span>
              )}
            </div>
            {level > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                Under: {category.parentName}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewProducts(category)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onEdit(category)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(category)}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => onAddSubcategory(category.id, category.name)}
            className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
          >
            Add Sub
          </button>
        </div>
      </div>

      {expanded && subcategories.length > 0 && (
        <div className="ml-6">
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="text-gray-600 text-sm">Organize your products with categories and subcategories</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setLoading(true);
                fetchCategories();
              }}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>

        {/* Categories Tree */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No categories yet. Create your first category to get started.</p>
              <p className="text-sm text-gray-400 mt-2">Debug: Categories array length is {categories.length}</p>
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

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full p-5">
              <h2 className="text-lg font-semibold mb-4">
                {formData.parentId ? 'Add Subcategory' : 'Add New Category'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.parentId ? "e.g., Toyota Keys" : "e.g., Car Keys"}
                  />
                </div>

                {formData.parentId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Parent Category:</strong> {formData.parentName}
                    </p>
                  </div>
                )}

              </div>
             <div className="flex gap-3 mt-6">
               <button
                 onClick={() => setShowAddModal(false)}
                 className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
               >
                 Cancel
               </button>
                                <button
                  onClick={handleAddCategory}
                  disabled={!formData.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {formData.parentId ? 'Add Subcategory' : 'Add Category'}
                </button>
             </div>
           </div>
         </div>
       )}

        {/* Edit Category Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full p-5">
              <h2 className="text-lg font-semibold mb-4">
                {selectedCategory?.isSubcategory ? 'Edit Subcategory' : 'Edit Category'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {selectedCategory?.isSubcategory && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Parent Category:</strong> {selectedCategory.parentName}
                    </p>
                  </div>
                )}

              </div>
             <div className="flex gap-3 mt-6">
               <button
                 onClick={() => setShowEditModal(false)}
                 className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={handleEditCategory}
                 disabled={!formData.name.trim()}
                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 Update Category
               </button>
             </div>
           </div>
         </div>
       )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Delete Category</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedCategory?.name}"? This will remove the category from all associated products.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Products Modal */}
        {showProductsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Products in {selectedCategory?.name}</h2>
                  <button
                    onClick={() => setShowProductsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                {categoryProducts.length > 0 ? (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={product.imageUrl} 
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{product.title}</h3>
                              <p className="text-sm text-gray-500">${product.price}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No products in this category yet.
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