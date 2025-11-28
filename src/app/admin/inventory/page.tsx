"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  updateDoc
} from "firebase/firestore";
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";


import { useAdminAuth } from "../context/AdminAuthContext";
import AdminProvider from "../AdminProvider";
import FlexibleProductForm from "../../components/FlexibleProductForm";

interface Product {
  id: string;
  title: string;
  model: string;
  price: string;
  oldPrice?: string;
  imageUrl: string;
  category?: string;
  categoryId?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  itemNumber?: string;
  ezNumber?: string;
  manufacturer?: string;
  stock?: number;
  lowStockAmount?: number;
  status?: 'active' | 'inactive' | 'out-of-stock' | 'coming-soon';
  isFeatured?: boolean;
  visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  allowReviews?: boolean;
  purchaseNote?: string;
  salePrice?: string;
  regularPrice?: string;
  categories?: string[];
  tags?: string[];
  shippingClass?: string;
  images?: string[];
  attributes?: {
    name: string;
    value: string;
    visible: boolean;
    global: boolean;
  }[];
  compatibleModels?: string[];
  replacesKeyTypes?: string[];
  technicalSpecs?: {
    reusable?: boolean;
    cloneable?: boolean;
    chipType?: string;
    testBlade?: string;
    frequency?: string;
    batteryType?: string;
    fccId?: string;
    can?: string;
    buttons?: string[];
    emergencyKeyIncluded?: boolean;
    aftermarket?: boolean;
  };
  // Additional fields for better categorization
  partNumber?: string;
  oemPartNumber?: string;
  aftermarketPartNumber?: string;
  buttonCount?: number;
  isOem?: boolean;
  isAftermarket?: boolean;
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: string;
  installationNotes?: string;
  // Filter fields
  vehicleType?: 'Car' | 'Truck' | 'SUV' | 'Van' | 'Motorcycle' | 'ATV' | 'Boat' | 'RV' | 'Commercial';
  vehicleTypes?: string[];
  brand?: string;
  year?: number;
  keyType?: string;
  availability?: 'in-stock' | 'out-of-stock' | 'coming-soon' | 'discontinued';
      // Vehicle compatibility for filtering
    selectedCompatibility?: Array<{
      brand: string;
      model: string;
      yearStart: string;
      yearEnd: string;
      keyTypes: string[];
    }>;
    compatibility?: Array<{
      make: string;
      model: string;
      yearRange: string;
    }>;
  createdAt?: any;
  updatedAt?: any;
}

// Recursive Category Tree Selector Component
interface CategoryTreeSelectorProps {
  categories: any[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
  level: number;
  parentId?: string | null;
}

function CategoryTreeSelector({ 
  categories, 
  selectedCategoryId, 
  onSelect, 
  level, 
  parentId = null 
}: CategoryTreeSelectorProps) {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  
  // Get direct children of current parent
  const children = categories.filter(cat => {
    if (parentId === null) {
      return !cat.parentId; // Main categories
    }
    return cat.parentId === parentId;
  });

  const toggleExpanded = (categoryId: string) => {
    setExpanded(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  if (children.length === 0) {
    return null;
  }

  return (
    <div className={`${level > 0 ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''}`}>
      {children.map((category) => {
        const hasChildren = categories.some(cat => cat.parentId === category.id);
        const isSelected = selectedCategoryId === category.id;
        const isExpanded = expanded[category.id] || false;

        return (
          <div key={category.id} className="mb-1">
            <div
              className={`
                flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors
                ${isSelected 
                  ? 'bg-blue-100 border-2 border-blue-500' 
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }
              `}
              onClick={() => onSelect(category.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(category.id);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                {!hasChildren && <span className="w-6" />}
                <span className={`text-sm flex-1 ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                  {category.name}
                </span>
                {isSelected && (
                  <span className="ml-2 text-xs text-blue-600 font-medium whitespace-nowrap">✓ Selected</span>
                )}
              </div>
            </div>

            {/* Recursively render children */}
            {hasChildren && isExpanded && (
              <CategoryTreeSelector
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={onSelect}
                level={level + 1}
                parentId={category.id}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdminInventoryContent() {
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropping, setCropping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFlexibleUploadModal, setShowFlexibleUploadModal] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkSelectedPath, setBulkSelectedPath] = useState<string[]>([]); // Track selection path for nested categories
  const [showBulkTextRemoveModal, setShowBulkTextRemoveModal] = useState(false);
  const [textToRemove, setTextToRemove] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);
  const [sortField, setSortField] = useState<'title' | 'sku' | 'price' | 'stock' | 'status'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ productId: string; field: 'price' | 'stock' | 'title' | 'sku' | 'category' | 'status' } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [savingCell, setSavingCell] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    model: "",
    price: "",
    oldPrice: "",
    category: "",
    description: "",
    shortDescription: "",
    sku: "",
    itemNumber: "",
    ezNumber: "",
    manufacturer: "",
    stock: "",
    lowStockAmount: "",
    status: "active",
    isFeatured: false,
    visibility: "visible",
    weight: "",
    length: "",
    width: "",
    height: "",
    allowReviews: true,
    purchaseNote: "",
    salePrice: "",
    regularPrice: "",
    categories: [] as string[],
    tags: "",
    shippingClass: "",
    vehicleType: "Car",
    brand: "",
    year: "",
    availability: "in-stock",
    compatibleModels: [] as string[],
    replacesKeyTypes: [] as string[],
    // Enhanced technical specifications based on product detail page
    technicalSpecs: {
      reusable: false,
      cloneable: false,
      chipType: "",
      testBlade: "",
      frequency: "",
      batteryType: "",
      fccId: "",
      can: "",
      buttons: [] as string[],
      emergencyKeyIncluded: false,
      aftermarket: false
    },
    // Additional fields for better categorization
    partNumber: "",
    oemPartNumber: "",
    aftermarketPartNumber: "",
    keyType: "Remote Key", // Remote Key, Smart Key, Transponder Key, etc.
    buttonCount: 1,
    isOem: false,
    isAftermarket: true,
    warranty: "",
    returnPolicy: "",
    shippingInfo: "",
    installationNotes: "",
    // Vehicle compatibility data
    selectedCompatibility: [] as Array<{
      brand: string;
      model: string;
      yearStart: string;
      yearEnd: string;
      keyTypes: string[];
    }>,
    vehicleTypes: [] as string[]
  });
  const cropAspect = 1; // Square aspect ratio for product images

  // Helper function to format price consistently
  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      if (price.startsWith('$')) {
        return price;
      }
      // Convert string to number and format consistently
      const numPrice = parseFloat(price);
      if (isNaN(numPrice)) {
        return `$${price}`;
      }
      return `$${numPrice.toFixed(2)}`;
    }
    return `$${price.toFixed(2)}`;
  };

  // Inline editing functions
  const startEditing = (productId: string, field: 'price' | 'stock' | 'title' | 'sku' | 'category' | 'status', currentValue: string | number) => {
    let value: string;
    
    if (field === 'price') {
      // Remove $ from price if present
      value = typeof currentValue === 'string' && currentValue.startsWith('$') 
        ? currentValue.replace('$', '') 
        : String(currentValue);
    } else if (field === 'category') {
      // For category, use categoryId if available, otherwise use category name
      const product = products.find(p => p.id === productId);
      value = product?.categoryId || '';
    } else {
      value = String(currentValue || '');
    }
    
    setEditingCell({ productId, field });
    setEditingValue(value);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    // Find the product to compare values
    const product = products.find(p => p.id === editingCell.productId);
    if (!product) {
      cancelEditing();
      return;
    }
    
    // Check if value actually changed
    let hasChanged = false;
    if (editingCell.field === 'price') {
      const priceValue = editingValue.replace('$', '').trim();
      const numPrice = parseFloat(priceValue);
      const currentPrice = typeof product.price === 'string' 
        ? parseFloat(product.price.replace('$', '')) 
        : product.price;
      hasChanged = Math.abs(numPrice - currentPrice) > 0.01; // Allow for floating point precision
    } else if (editingCell.field === 'stock') {
      const stockValue = parseInt(editingValue);
      hasChanged = stockValue !== (product.stock || 0);
    } else if (editingCell.field === 'title') {
      hasChanged = editingValue.trim() !== (product.title || '');
    } else if (editingCell.field === 'sku') {
      hasChanged = editingValue.trim() !== (product.sku || '');
    } else if (editingCell.field === 'category') {
      hasChanged = editingValue !== (product.categoryId || '');
    } else if (editingCell.field === 'status') {
      hasChanged = editingValue !== (product.status || 'active');
    }
    
    // If no change, just cancel
    if (!hasChanged) {
      cancelEditing();
      return;
    }
    
    setSavingCell(true);
    try {
      const productRef = doc(db, "products", editingCell.productId);
      const updateData: any = {};
      
      if (editingCell.field === 'price') {
        // Remove $ if present and validate
        const priceValue = editingValue.replace('$', '').trim();
        const numPrice = parseFloat(priceValue);
        if (isNaN(numPrice) || numPrice < 0) {
          showNotification('error', 'Please enter a valid price');
          cancelEditing();
          setSavingCell(false);
          return;
        }
        updateData.price = formatPrice(numPrice);
      } else if (editingCell.field === 'stock') {
        const stockValue = parseInt(editingValue);
        if (isNaN(stockValue) || stockValue < 0) {
          showNotification('error', 'Please enter a valid stock number');
          cancelEditing();
          setSavingCell(false);
          return;
        }
        updateData.stock = stockValue;
      } else if (editingCell.field === 'title') {
        const titleValue = editingValue.trim();
        if (!titleValue) {
          showNotification('error', 'Product name cannot be empty');
          cancelEditing();
          setSavingCell(false);
          return;
        }
        updateData.title = titleValue;
      } else if (editingCell.field === 'sku') {
        updateData.sku = editingValue.trim();
      } else if (editingCell.field === 'category') {
        const categoryId = editingValue;
        const selectedCategory = availableCategories.find(cat => cat.id === categoryId);
        if (!selectedCategory && categoryId) {
          showNotification('error', 'Selected category not found');
          cancelEditing();
          setSavingCell(false);
          return;
        }
        updateData.categoryId = categoryId || null;
        updateData.category = selectedCategory?.name || null;
      } else if (editingCell.field === 'status') {
        const validStatuses = ['active', 'inactive', 'out-of-stock', 'coming-soon'];
        if (!validStatuses.includes(editingValue)) {
          showNotification('error', 'Please select a valid status');
          cancelEditing();
          setSavingCell(false);
          return;
        }
        updateData.status = editingValue;
      }
      
      updateData.updatedAt = new Date();
      
      await updateDoc(productRef, updateData);
      const fieldNames: { [key: string]: string } = {
        price: 'Price',
        stock: 'Stock',
        title: 'Product name',
        sku: 'SKU',
        category: 'Category',
        status: 'Status'
      };
      showNotification('success', `${fieldNames[editingCell.field] || 'Field'} updated successfully`);
      
      // Update local state immediately for better UX
      setProducts(prev => prev.map(p => 
        p.id === editingCell.productId 
          ? { ...p, ...updateData }
          : p
      ));
      
      cancelEditing();
    } catch (error) {
      console.error("Error updating product:", error);
      showNotification('error', 'Failed to update product');
    }
    setSavingCell(false);
  };

  // Handle Enter key to save, Escape to cancel
  const handleInlineEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Handle select dropdown changes - save immediately
  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>, field: 'category' | 'status') => {
    if (!editingCell) return;
    
    const newValue = e.target.value;
    const product = products.find(p => p.id === editingCell.productId);
    if (!product) {
      cancelEditing();
      return;
    }
    
    // Check if value changed
    const currentValue = field === 'category' ? (product.categoryId || '') : (product.status || 'active');
    if (newValue === currentValue) {
      cancelEditing();
      return;
    }
    
    setEditingValue(newValue);
    setSavingCell(true);
    
    try {
      const productRef = doc(db, "products", editingCell.productId);
      const updateData: any = {};
      
      if (field === 'category') {
        const selectedCategory = availableCategories.find(cat => cat.id === newValue);
        if (!selectedCategory && newValue) {
          showNotification('error', 'Selected category not found');
          cancelEditing();
          setSavingCell(false);
          return;
        }
        updateData.categoryId = newValue || null;
        updateData.category = selectedCategory?.name || null;
      } else if (field === 'status') {
        const validStatuses = ['active', 'inactive', 'out-of-stock', 'coming-soon'];
        if (!validStatuses.includes(newValue)) {
          showNotification('error', 'Please select a valid status');
          cancelEditing();
          setSavingCell(false);
          return;
        }
        updateData.status = newValue;
      }
      
      updateData.updatedAt = new Date();
      
      await updateDoc(productRef, updateData);
      showNotification('success', `${field === 'category' ? 'Category' : 'Status'} updated successfully`);
      
      // Update local state immediately
      setProducts(prev => prev.map(p => 
        p.id === editingCell.productId 
          ? { ...p, ...updateData }
          : p
      ));
      
      cancelEditing();
    } catch (error) {
      console.error("Error updating product:", error);
      showNotification('error', 'Failed to update product');
    }
    setSavingCell(false);
  };

  // Helper function to get the best available image
  const getProductImage = (product: Product): string => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    if (product.imageUrl) {
      return product.imageUrl;
    }
    return '/sample-key-1.png'; // Fallback image
  };

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };



  async function fetchProducts() {
    setLoading(true);
    try {
      const q = query(collection(db, "products"), orderBy("title"));
      const snap = await getDocs(q);
      const fetchedProducts = snap.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Product;
      });
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "No Category";
    const category = availableCategories.find(cat => cat.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  // Helper function to get next available SKU number
  const getNextAvailableSKU = () => {
    const existingSKUs = products
      .map(p => p.sku ? parseInt(p.sku) : null)
      .filter((sku): sku is number => sku !== null && !isNaN(sku))
      .sort((a, b) => a - b);
    
    if (existingSKUs.length === 0) return 1;
    
    // Find the first gap in the sequence, or use the next number after the highest
    let nextSKU = 1;
    for (const sku of existingSKUs) {
      if (sku !== nextSKU) {
        break;
      }
      nextSKU++;
    }
    
    return nextSKU;
  };

  // Export products to Excel/CSV
  const exportToExcel = () => {
    try {
      // Prepare data for export - reordered fields with actual images
      const exportData = sortedProducts.map(product => ({
        'Image': product.imageUrl || '',
        'Product Name': product.title || '',
        'Price': product.price || '',
        'SKU': product.sku || ''
      }));

      // Create HTML table with images
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Inventory Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            img { max-width: 100px; max-height: 100px; object-fit: contain; }
            .image-cell { width: 120px; text-align: center; }
            .name-cell { width: 300px; }
            .price-cell { width: 100px; text-align: center; }
            .sku-cell { width: 100px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Inventory Export - ${new Date().toLocaleDateString()}</h1>
          <table>
            <thead>
              <tr>
                <th class="image-cell">Image</th>
                <th class="name-cell">Product Name</th>
                <th class="price-cell">Price</th>
                <th class="sku-cell">SKU</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map(row => `
                <tr>
                  <td class="image-cell">
                    <img src="${row.Image}" alt="${row['Product Name']}" onerror="this.style.display='none'">
                  </td>
                  <td class="name-cell">${row['Product Name']}</td>
                  <td class="price-cell">${row['Price']}</td>
                  <td class="sku-cell">${row['SKU']}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create and download HTML file
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('success', `Exported ${exportData.length} products to HTML with images`);
    } catch (error) {
      console.error('Export error:', error);
      showNotification('error', 'Failed to export products');
    }
  };

  useEffect(() => { 
    if (isAuthenticated) {
      fetchProducts();
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Filter products based on search and filters - memoized for performance
  const filteredProducts = useMemo(() => {
    try {
      return (products || []).filter(product => {
        // Ensure product exists and has required properties
        if (!product) return false;
        
        // Ensure searchTerm is a string and handle empty search
        const searchLower = (searchTerm || '').toLowerCase();
        
        const matchesSearch = searchLower === '' || 
                             (product.title && product.title.toLowerCase().includes(searchLower)) ||
                             (product.model && product.model.toLowerCase().includes(searchLower)) ||
                             (product.sku && product.sku.toLowerCase().includes(searchLower));
        const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
        const matchesStatus = !selectedStatus || product.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering products:', error);
      return [];
    }
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  // Sort filtered products - memoized for performance
  const sortedProducts = useMemo(() => {
    try {
      return [...filteredProducts].sort((a, b) => {
        // Ensure both products exist
        if (!a || !b) return 0;
        
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        // Handle SKU sorting (convert to numbers for proper numeric sorting)
        if (sortField === 'sku') {
          aValue = aValue ? parseInt(aValue) || 0 : 0;
          bValue = bValue ? parseInt(bValue) || 0 : 0;
        }
        // Handle price sorting (convert to numbers)
        else if (sortField === 'price') {
          aValue = aValue ? parseFloat(aValue) || 0 : 0;
          bValue = bValue ? parseFloat(bValue) || 0 : 0;
        }
        // Handle stock sorting (convert to numbers)
        else if (sortField === 'stock') {
          aValue = aValue !== undefined && aValue !== null ? aValue : 0;
          bValue = bValue !== undefined && bValue !== null ? bValue : 0;
        }
        // Handle string sorting (title, status, etc.)
        else {
          aValue = aValue || '';
          bValue = bValue || '';
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    } catch (error) {
      console.error('Error sorting products:', error);
      return filteredProducts || [];
    }
  }, [filteredProducts, sortField, sortDirection]);

  // Pagination logic - memoized for performance
  const paginationData = useMemo(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct) || [];
    const totalPages = Math.max(1, Math.ceil((sortedProducts?.length || 0) / productsPerPage));
    
    return {
      currentProducts,
      totalPages,
      indexOfFirstProduct,
      indexOfLastProduct
    };
  }, [sortedProducts, currentPage, productsPerPage]);

  const { currentProducts, totalPages } = paginationData;

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, sortField, sortDirection]);

  // Ensure currentPage is valid when products change
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle column sorting - memoized for performance
  const handleSort = useCallback((field: 'title' | 'sku' | 'price' | 'stock' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Handle drop
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      const url = URL.createObjectURL(acceptedFiles[0]);
      setPreviewUrl(url);
      setCropping(true);
      // Get image size for minZoom calculation
      const img = new window.Image();
      img.onload = () => setImageSize({ width: img.width, height: img.height });
      img.src = url;
    }
  };

  // Cancel upload process
  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setCropping(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setImageSize(null);
    setFormData({
      title: "",
      model: "",
      price: "",
      oldPrice: "",
      category: "",
      description: "",
      shortDescription: "",
      sku: "",
      itemNumber: "",
      ezNumber: "",
      manufacturer: "",
      stock: "",
      lowStockAmount: "",
      status: "active",
      isFeatured: false,
      visibility: "visible",
      weight: "",
      length: "",
      width: "",
      height: "",
      allowReviews: true,
      purchaseNote: "",
      salePrice: "",
      regularPrice: "",
      categories: [],
      tags: "",
      shippingClass: "",
      vehicleType: "Car",
      brand: "",
      year: "",
      availability: "in-stock",
      compatibleModels: [],
      replacesKeyTypes: [],
      technicalSpecs: {
        reusable: false,
        cloneable: false,
        chipType: "",
        testBlade: "",
        frequency: "",
        batteryType: "",
        fccId: "",
        can: "",
        buttons: [],
        emergencyKeyIncluded: false,
        aftermarket: false
      },
      partNumber: "",
      oemPartNumber: "",
      aftermarketPartNumber: "",
      keyType: "Remote Key",
      buttonCount: 1,
      isOem: false,
      isAftermarket: true,
      warranty: "",
      returnPolicy: "",
      shippingInfo: "",
      installationNotes: "",
      // Vehicle compatibility data
      selectedCompatibility: [],
      vehicleTypes: []
    });
    setShowEditModal(false);
    setEditingProduct(null);
  };

  // Close modal
  const handleCloseModal = () => {
    if (!uploading) {
      handleCancelUpload();
    }
  };

  // Handle flexible form submission
  async function handleFlexibleUploadAndAdd(formData: any) {
    setUploading(true);
    
    try {
      let imageUrls: string[] = [];
      
      // Upload multiple images to Firebase Storage
      if (formData.images && formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          const image = formData.images[i];
          
          // If it's a base64 image (including edited images), upload it to Firebase Storage
          if (image.startsWith('data:')) {
            try {
              // Convert base64 to blob directly without using fetch
              const base64Response = image.split(',')[1];
              const byteCharacters = atob(base64Response);
              const byteNumbers = new Array(byteCharacters.length);
              for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/jpeg' });
              
              const storageRef = ref(storage, `products/${Date.now()}_${i}_product.jpg`);
              await uploadBytes(storageRef, blob);
              const downloadUrl = await getDownloadURL(storageRef);
              imageUrls.push(downloadUrl);
            } catch (uploadError) {
              console.error(`Error uploading image ${i + 1}:`, uploadError);
              // If upload fails, try to keep the original image if it's a URL
              if (image.startsWith('http')) {
                imageUrls.push(image);
              }
            }
          } else if (image.startsWith('http')) {
            // If it's already a URL, keep it
            imageUrls.push(image);
          } else {
            console.warn(`Skipping invalid image ${i + 1}:`, image.substring(0, 50) + '...');
          }
        }
      }
      
      
      
      // Save to Firestore with flexible fields
      await addDoc(collection(db, "products"), {
        title: formData.title,
        price: formData.price,
        oldPrice: formData.oldPrice || null,
        imageUrl: imageUrls[0] || "",
        images: imageUrls,
        category: formData.category || "General",
        categoryId: formData.categoryId || null,
        description: formData.description || "",
        shortDescription: formData.shortDescription || "",
        sku: formData.sku || "",
        partNumber: formData.partNumber || "",
        manufacturer: formData.manufacturer || "",
        stock: formData.stock || 0,
        status: formData.status || "active",
        customFields: formData.customFields || [],
        warranty: formData.warranty || "",
        returnPolicy: formData.returnPolicy || "",
        shippingInfo: formData.shippingInfo || "",
        installationNotes: formData.installationNotes || "",
        purchaseNote: formData.purchaseNote || "",
        allowReviews: formData.allowReviews ?? true,
        // Vehicle compatibility fields
        compatibility: formData.compatibility || [],
        selectedCompatibility: formData.selectedCompatibility || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setShowFlexibleUploadModal(false);
      showNotification('success', 'Product added successfully!');
      await fetchProducts();
    } catch (error) {
      console.error("Error uploading product:", error);
      showNotification('error', 'Error adding product. Please try again.');
    }
    setUploading(false);
  }

  // Calculate minZoom to ensure image fits properly in crop frame
  let minZoom = 1;
  if (imageSize) {
    const imageAspect = imageSize.width / imageSize.height;
    if (imageAspect > cropAspect) {
      // Image is wider than crop area - scale to fit height
      minZoom = cropAspect / imageAspect;
    } else {
      // Image is taller than crop area - scale to fit width
      minZoom = 1;
    }
    // Ensure minZoom is at least 0.8 to allow some flexibility
    minZoom = Math.max(minZoom, 0.8);
  }

  // Cropping callback
  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Center crop when image loads or minZoom changes
  useEffect(() => {
    if (cropping && previewUrl) {
      setCrop({ x: 0, y: 0 });
    }
  }, [previewUrl, cropping, minZoom]);

  // Handle form submission from EnhancedProductForm
  async function handleUploadAndAdd(formData: any) {
    setUploading(true);
    
    try {
      let imageUrls: string[] = [];
      
      // Upload multiple images to Firebase Storage
      if (formData.images && formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          const image = formData.images[i];
          
          // If it's a base64 image (including edited images), upload it to Firebase Storage
          if (image.startsWith('data:')) {
            try {
              // Convert base64 to blob directly without using fetch
              const base64Response = image.split(',')[1];
              const byteCharacters = atob(base64Response);
              const byteNumbers = new Array(byteCharacters.length);
              for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/jpeg' });
              
              const storageRef = ref(storage, `products/${Date.now()}_${i}_product.jpg`);
              await uploadBytes(storageRef, blob);
              const downloadUrl = await getDownloadURL(storageRef);
              imageUrls.push(downloadUrl);
            } catch (uploadError) {
              console.error(`Error uploading image ${i + 1}:`, uploadError);
              // If upload fails, try to keep the original image if it's a URL
              if (image.startsWith('http')) {
                imageUrls.push(image);
              }
            }
          } else if (image.startsWith('http')) {
            // If it's already a URL, keep it
            imageUrls.push(image);
          } else {
            console.warn(`Skipping invalid image ${i + 1}:`, image.substring(0, 50) + '...');
          }
        }
      }
      
      
      
      // Save to Firestore with all fields
      await addDoc(collection(db, "products"), {
        title: formData.title,
        model: formData.model || "",
        price: formData.price,
        oldPrice: formData.oldPrice || null,
        imageUrl: imageUrls[0] || "", // Keep main image for backward compatibility
        images: imageUrls, // Store all images in array
        category: formData.category || "Car Keys",
        categoryId: formData.categoryId || null,
        description: formData.description || "",
        shortDescription: formData.shortDescription || "",
        sku: formData.sku || "",
        partNumber: formData.partNumber || "",
        manufacturer: formData.manufacturer || "",
        stock: formData.stock ? parseInt(formData.stock) : 0,
        lowStockAmount: formData.lowStockAmount ? parseInt(formData.lowStockAmount) : 0,
        status: formData.status || "active",
        isFeatured: formData.isFeatured || false,
        visibility: formData.visibility || "visible",
        salePrice: formData.salePrice || null,
        regularPrice: formData.regularPrice || formData.price,
        vehicleType: formData.vehicleType || "Car",
        brand: formData.brand || "",
        year: formData.year ? parseInt(formData.year) : null,
        keyType: formData.keyType || "Remote Key",
        availability: formData.availability || "in-stock",
        compatibleModels: formData.compatibleModels || [],
        replacesKeyTypes: formData.replacesKeyTypes || [],
        technicalSpecs: formData.technicalSpecs || {},
        oemPartNumber: formData.oemPartNumber || "",
        aftermarketPartNumber: formData.aftermarketPartNumber || "",
        buttonCount: formData.buttonCount || 1,
        isOem: formData.isOem || false,
        isAftermarket: formData.isAftermarket ?? true,
        warranty: formData.warranty || "",
        returnPolicy: formData.returnPolicy || "",
        shippingInfo: formData.shippingInfo || "",
        installationNotes: formData.installationNotes || "",
        allowReviews: formData.allowReviews ?? true,
        purchaseNote: formData.purchaseNote || "",
        tags: formData.tags || "",
        shippingClass: formData.shippingClass || "",
        // Vehicle compatibility data for filtering
        selectedCompatibility: formData.selectedCompatibility || [],
        compatibility: formData.compatibility || [], // Add this for consistent filtering
        vehicleTypes: formData.vehicleTypes || [],
        categories: formData.categories || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setShowEditModal(false);
      showNotification('success', 'Product added successfully!');
      await fetchProducts();
    } catch (error) {
      console.error("Error uploading product:", error);
      showNotification('error', 'Error adding product. Please try again.');
    }
    setUploading(false);
  }

  // Edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      model: product.model || "",
      price: product.price,
      oldPrice: product.oldPrice || "",
      category: product.category || "",
      description: product.description || "",
        shortDescription: product.shortDescription || "",
      sku: product.sku || "",
        itemNumber: product.itemNumber || "",
        ezNumber: product.ezNumber || "",
        manufacturer: product.manufacturer || "",
      stock: product.stock?.toString() || "",
        lowStockAmount: product.lowStockAmount?.toString() || "",
        status: product.status || "active",
        isFeatured: product.isFeatured || false,
        visibility: product.visibility || "visible",
        weight: product.weight?.toString() || "",
        length: product.dimensions?.length?.toString() || "",
        width: product.dimensions?.width?.toString() || "",
        height: product.dimensions?.height?.toString() || "",
        allowReviews: product.allowReviews ?? true,
        purchaseNote: product.purchaseNote || "",
        salePrice: product.salePrice || "",
        regularPrice: product.regularPrice || "",
        categories: product.categories || [],
        tags: Array.isArray(product.tags) ? product.tags.join(", ") : product.tags || "",
        shippingClass: product.shippingClass || "",
        vehicleType: product.vehicleType || "Car",
        brand: product.brand || "",
        year: product.year?.toString() || "",
        keyType: product.keyType || "",
        availability: product.availability || "in-stock",
        compatibleModels: product.compatibleModels || [],
        replacesKeyTypes: product.replacesKeyTypes || [],
        technicalSpecs: {
          reusable: product.technicalSpecs?.reusable ?? false,
          cloneable: product.technicalSpecs?.cloneable ?? false,
          chipType: product.technicalSpecs?.chipType ?? "",
          testBlade: product.technicalSpecs?.testBlade ?? "",
          frequency: product.technicalSpecs?.frequency ?? "",
          batteryType: product.technicalSpecs?.batteryType ?? "",
          fccId: product.technicalSpecs?.fccId ?? "",
          can: product.technicalSpecs?.can ?? "",
          buttons: product.technicalSpecs?.buttons ?? [],
          emergencyKeyIncluded: product.technicalSpecs?.emergencyKeyIncluded ?? false,
          aftermarket: product.technicalSpecs?.aftermarket ?? false
        },
        partNumber: product.partNumber || "",
        oemPartNumber: product.oemPartNumber || "",
        aftermarketPartNumber: product.aftermarketPartNumber || "",
        buttonCount: product.buttonCount || 1,
        isOem: product.isOem || false,
        isAftermarket: product.isAftermarket ?? true,
        warranty: product.warranty || "",
        returnPolicy: product.returnPolicy || "",
        shippingInfo: product.shippingInfo || "",
        installationNotes: product.installationNotes || "",
        // Vehicle compatibility data
        selectedCompatibility: product.selectedCompatibility || [],
        vehicleTypes: product.vehicleTypes || []
    });
    setShowEditModal(true);
  };

  // Update product
  const handleUpdate = async (formData: any) => {
    if (!editingProduct) return;
    setUploading(true);
    
    try {
      let imageUrls: string[] = editingProduct.images || [editingProduct.imageUrl].filter(Boolean);
      
      // Upload multiple images to Firebase Storage
      if (formData.images && formData.images.length > 0) {
        imageUrls = [];
        for (let i = 0; i < formData.images.length; i++) {
          const image = formData.images[i];
          
          // If it's a base64 image (including edited images), upload it to Firebase Storage
          if (image.startsWith('data:')) {
            try {
              const response = await fetch(image);
              const blob = await response.blob();
              const storageRef = ref(storage, `products/${Date.now()}_${i}_product.jpg`);
              await uploadBytes(storageRef, blob);
              const downloadUrl = await getDownloadURL(storageRef);
              imageUrls.push(downloadUrl);
            } catch (uploadError) {
              console.error(`Error uploading image ${i + 1}:`, uploadError);
              // If upload fails, try to keep the original image if it's a URL
              if (image.startsWith('http')) {
                imageUrls.push(image);
              }
            }
          } else if (image.startsWith('http')) {
            // If it's already a URL, keep it
            imageUrls.push(image);
          } else {
            console.warn(`Skipping invalid image ${i + 1}:`, image.substring(0, 50) + '...');
          }
        }
      }
      
      // Determine category and categoryId - prioritize formData, then existing product, then lookup
      let finalCategoryId = formData.categoryId || editingProduct.categoryId || null;
      let finalCategory = formData.category || editingProduct.category || null;
      
      // If we have a categoryId but no category name, look it up
      if (finalCategoryId && !finalCategory) {
        finalCategory = getCategoryName(finalCategoryId);
        // If lookup returns "Unknown Category" or "No Category", set to null
        if (finalCategory === "Unknown Category" || finalCategory === "No Category") {
          finalCategory = null;
        }
      }
      
      const updateData: any = {
        title: formData.title,
        model: formData.model || "",
        price: formData.price,
        oldPrice: formData.oldPrice || null,
        imageUrl: imageUrls[0] || "", // Keep main image for backward compatibility
        images: imageUrls, // Store all images in array
        category: finalCategory,
        categoryId: finalCategoryId,
        description: formData.description || "",
        sku: formData.sku || "",
        stock: formData.stock ? parseInt(formData.stock) : 0,
        status: formData.status as 'active' | 'inactive' | 'out-of-stock',
        technicalSpecs: formData.technicalSpecs || {},
        partNumber: formData.partNumber || "",
        manufacturer: formData.manufacturer || "",
        // Vehicle compatibility data for filtering
        selectedCompatibility: formData.selectedCompatibility || [],
        compatibility: formData.compatibility || [], // Add this for consistent filtering
        vehicleTypes: formData.vehicleTypes || [],
        categories: formData.categories || [],
        shortDescription: formData.shortDescription || "",
        customFields: formData.customFields || [],
        allowReviews: formData.allowReviews ?? true,
        updatedAt: new Date()
      };



      await updateDoc(doc(db, "products", editingProduct.id), updateData);
      
      setShowEditModal(false);
      setEditingProduct(null);
      setSelectedFile(null);
      setPreviewUrl("");
      setCropping(false);
      setFormData({
        title: "",
        model: "",
        price: "",
        oldPrice: "",
        category: "",
        description: "",
        shortDescription: "",
        sku: "",
        itemNumber: "",
        ezNumber: "",
        manufacturer: "",
        stock: "",
        lowStockAmount: "",
        status: "active",
        isFeatured: false,
        visibility: "visible",
        weight: "",
        length: "",
        width: "",
        height: "",
        allowReviews: true,
        purchaseNote: "",
        salePrice: "",
        regularPrice: "",
        categories: [],
        tags: "",
        shippingClass: "",
        vehicleType: "Car",
        brand: "",
        year: "",
        keyType: "",
        availability: "in-stock",
        compatibleModels: [],
        replacesKeyTypes: [],
        technicalSpecs: {
          reusable: false,
          cloneable: false,
          chipType: "",
          testBlade: "",
          frequency: "",
          batteryType: "",
          fccId: "",
          can: "",
          buttons: [],
          emergencyKeyIncluded: false,
          aftermarket: false
        },
        partNumber: "",
        oemPartNumber: "",
        aftermarketPartNumber: "",
        buttonCount: 1,
        isOem: false,
        isAftermarket: true,
        warranty: "",
        returnPolicy: "",
        shippingInfo: "",
        installationNotes: "",
        // Vehicle compatibility data
        selectedCompatibility: [],
        vehicleTypes: []
      });
      await fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
    }
    setUploading(false);
  };

  async function handleDelete(id: string, imageUrl: string) {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this product? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      // Optimistically remove from UI immediately
      setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== id));
      
      // Delete from Firestore
      await deleteDoc(doc(db, "products", id));
      
      // Delete from Firebase Storage
      if (imageUrl) {
        try {
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
        } catch (storageError) {
          console.warn("Could not delete image from storage:", storageError);
        }
      }
      
      // Show success message
      showNotification('success', 'Product deleted successfully');
      
      // Refresh data to ensure consistency
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      showNotification('error', 'Failed to delete product');
      // Revert optimistic update on error
      await fetchProducts();
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected product(s)? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }
    
    try {
      // Optimistically remove selected products from UI immediately
      setProducts((prev: Product[]) => prev.filter((p: Product) => !selectedProducts.includes(p.id)));
      
      // Delete each product
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        if (product) {
          await deleteDoc(doc(db, "products", productId));
          if (product.imageUrl) {
            try {
            const storageRef = ref(storage, product.imageUrl);
            await deleteObject(storageRef);
            } catch (storageError) {
              console.warn(`Could not delete image for product ${productId}:`, storageError);
          }
        }
      }
      }
      
      setSelectedProducts([]);
      setShowBulkActions(false);
      showNotification('success', `Successfully deleted ${selectedProducts.length} product(s)`);
      
      // Refresh data to ensure consistency
      await fetchProducts();
    } catch (error) {
      console.error("Error bulk deleting products:", error);
      showNotification('error', 'Failed to delete products');
      // Revert optimistic update on error
      await fetchProducts();
    }
  };

  // Toggle product selection - memoized for performance
  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const newSelection = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      return newSelection;
    });
  }, []);

  // Toggle select all products - memoized for performance
  const toggleSelectAll = useCallback(() => {
    const allSelected = currentProducts.every(p => selectedProducts.includes(p.id));
    if (allSelected) {
      // If all are selected, clear selection
      setSelectedProducts([]);
    } else {
      // If not all are selected, select all
      setSelectedProducts(currentProducts.map(p => p.id));
    }
  }, [currentProducts, selectedProducts]);

  // Clear selection
  const clearSelection = () => {
    setSelectedProducts([]);
    setShowBulkCategoryModal(false);
    setBulkCategoryId('');
    setBulkSelectedPath([]);
    setShowBulkTextRemoveModal(false);
    setTextToRemove('');
  };

  // Helper function to get all children of a category (recursive)
  const getCategoryChildren = useCallback((parentId: string | null): any[] => {
    return availableCategories.filter(cat => cat.parentId === parentId);
  }, [availableCategories]);

  // Helper function to get category path (breadcrumb)
  const getCategoryPath = useCallback((categoryId: string): string[] => {
    const path: string[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const category = availableCategories.find(cat => cat.id === currentId);
      if (!category) break;
      path.unshift(category.id);
      currentId = category.parentId || null;
    }
    
    return path;
  }, [availableCategories]);

  // Handle category selection at any level
  const handleBulkCategorySelect = (categoryId: string, isSelectable: boolean = true) => {
    if (!isSelectable) return;
    
    setBulkCategoryId(categoryId);
    setBulkSelectedPath(getCategoryPath(categoryId));
  };

  // Bulk category update
  const handleBulkCategoryUpdate = async () => {
    if (selectedProducts.length === 0 || !bulkCategoryId) {
      showNotification('error', 'Please select a category');
      return;
    }
    
    const selectedCategory = availableCategories.find(cat => cat.id === bulkCategoryId);
    if (!selectedCategory) {
      showNotification('error', 'Selected category not found');
      return;
    }
    
    const categoryName = selectedCategory.name;
    const confirmed = window.confirm(
      `Are you sure you want to assign "${categoryName}" to ${selectedProducts.length} selected product(s)?`
    );
    
    if (!confirmed) {
      return;
    }
    
    setUploading(true);
    
    try {
      // Update each selected product
      for (const productId of selectedProducts) {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, {
          category: categoryName,
          categoryId: bulkCategoryId,
          updatedAt: new Date()
        });
      }
      
      showNotification('success', `Successfully updated ${selectedProducts.length} product(s) to "${categoryName}"`);
      
      // Clear selection and modal
      setSelectedProducts([]);
      setShowBulkCategoryModal(false);
      setBulkCategoryId('');
      setBulkSelectedPath([]);
      
      // Refresh data
      await fetchProducts();
    } catch (error) {
      console.error("Error bulk updating categories:", error);
      showNotification('error', 'Failed to update product categories');
    }
    
    setUploading(false);
  };

  // Bulk text removal from product titles
  const handleBulkTextRemove = async () => {
    if (selectedProducts.length === 0 || !textToRemove.trim()) {
      showNotification('error', 'Please enter text to remove');
      return;
    }
    
    const confirmed = window.confirm(
      `Are you sure you want to remove "${textToRemove}" from ${selectedProducts.length} selected product title(s)?\n\nThis will remove all occurrences of the text from product names.`
    );
    
    if (!confirmed) {
      return;
    }
    
    setUploading(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Update each selected product
      for (const productId of selectedProducts) {
        try {
          const product = products.find(p => p.id === productId);
          if (!product) {
            errorCount++;
            continue;
          }
          
          // Remove the text from title (case-insensitive, remove all occurrences)
          const originalTitle = product.title;
          const newTitle = originalTitle.replace(new RegExp(textToRemove.trim(), 'gi'), '').trim();
          
          // Clean up any double spaces or leading/trailing dashes/spaces
          const cleanedTitle = newTitle.replace(/\s+/g, ' ').replace(/^[\s\-]+|[\s\-]+$/g, '').trim();
          
          if (cleanedTitle === originalTitle) {
            // No change was made, skip this product
            continue;
          }
          
          if (cleanedTitle.length === 0) {
            showNotification('error', `Cannot remove text from product "${originalTitle}" - would result in empty title`);
            errorCount++;
            continue;
          }
          
          const productRef = doc(db, "products", productId);
          await updateDoc(productRef, {
            title: cleanedTitle,
            updatedAt: new Date()
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error updating product ${productId}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showNotification('success', `Successfully removed "${textToRemove}" from ${successCount} product(s)`);
      }
      
      if (errorCount > 0) {
        showNotification('error', `Failed to update ${errorCount} product(s)`);
      }
      
      // Clear selection and modal
      setSelectedProducts([]);
      setShowBulkTextRemoveModal(false);
      setTextToRemove('');
      
      // Refresh data
      await fetchProducts();
    } catch (error) {
      console.error("Error bulk removing text:", error);
      showNotification('error', 'Failed to remove text from product titles');
    }
    
    setUploading(false);
  };

  // Add sample products for testing
  const addSampleProducts = async () => {
    setLoading(true);
    try {
      const sampleProducts = [
        {
          title: "Ford F-150 3-Button Remote Key",
          model: "N5F-A08TBLP",
          price: "188.95",
          oldPrice: null,
          imageUrl: "/sample-key-1.png",
          category: "Car Keys",
          description: "Compatible with Ford F-150 models 2015-2020",
          shortDescription: "3-button remote key for Ford F-150",
          sku: "FORD-F150-3BTN",
          itemNumber: "FORD-F150-3BTN",
          ezNumber: "FORD-F150-3BTN",
          manufacturer: "Ford",
          stock: 25,
          lowStockAmount: 5,
          status: "active",
          isFeatured: true,
          visibility: "visible",
          weight: 0.1,
          dimensions: { length: 8, width: 3, height: 1 },
          allowReviews: true,
          purchaseNote: "",
          salePrice: null,
          regularPrice: "188.95",
          categories: ["Ford", "Truck", "Remote Keys"],
          tags: "ford,f150,truck,remote,key",
          shippingClass: "",
          vehicleType: "Truck",
          brand: "Ford",
          year: 2018,
          keyType: "Remote Key",
          availability: "in-stock",
          compatibleModels: ["F-150 2015-2020"],
          replacesKeyTypes: [],
          technicalSpecs: {
            reusable: false,
            cloneable: true,
            chipType: "HITAG2",
            testBlade: "B106",
            frequency: "315MHz",
            batteryType: "CR2032"
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Toyota Camry Smart Key Proximity Remote",
          model: "HYQ14FBA",
          price: "129.99",
          oldPrice: "159.99",
          imageUrl: "/sample-key-2.png",
          category: "Car Keys",
          description: "Smart key proximity remote for Toyota Camry 2018-2022",
          shortDescription: "Smart key for Toyota Camry",
          sku: "TOYOTA-CAMRY-SMART",
          itemNumber: "TOYOTA-CAMRY-SMART",
          ezNumber: "TOYOTA-CAMRY-SMART",
          manufacturer: "Toyota",
          stock: 15,
          lowStockAmount: 3,
          status: "active",
          isFeatured: true,
          visibility: "visible",
          weight: 0.08,
          dimensions: { length: 7, width: 2.5, height: 0.8 },
          allowReviews: true,
          purchaseNote: "",
          salePrice: "129.99",
          regularPrice: "159.99",
          categories: ["Toyota", "Car", "Smart Keys"],
          tags: "toyota,camry,car,smart,key,proximity",
          shippingClass: "",
          vehicleType: "Car",
          brand: "Toyota",
          year: 2020,
          keyType: "Smart Key",
          availability: "in-stock",
          compatibleModels: ["Camry 2018-2022"],
          replacesKeyTypes: [],
          technicalSpecs: {
            reusable: false,
            cloneable: false,
            chipType: "HITAG3",
            testBlade: "B108",
            frequency: "315MHz",
            batteryType: "CR2032"
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Honda CR-V Transponder Key",
          model: "HON66T",
          price: "39.95",
          oldPrice: null,
          imageUrl: "/sample-key-3.png",
          category: "Car Keys",
          description: "Transponder key for Honda CR-V 2016-2021",
          shortDescription: "Transponder key for Honda CR-V",
          sku: "HONDA-CRV-TRANSPONDER",
          itemNumber: "HONDA-CRV-TRANSPONDER",
          ezNumber: "HONDA-CRV-TRANSPONDER",
          manufacturer: "Honda",
          stock: 40,
          lowStockAmount: 10,
          status: "active",
          isFeatured: false,
          visibility: "visible",
          weight: 0.05,
          dimensions: { length: 6, width: 2, height: 0.5 },
          allowReviews: true,
          purchaseNote: "",
          salePrice: null,
          regularPrice: "39.95",
          categories: ["Honda", "SUV", "Transponder Keys"],
          tags: "honda,crv,suv,transponder,key",
          shippingClass: "",
          vehicleType: "SUV",
          brand: "Honda",
          year: 2019,
          keyType: "Transponder Key",
          availability: "in-stock",
          compatibleModels: ["CR-V 2016-2021"],
          replacesKeyTypes: [],
          technicalSpecs: {
            reusable: false,
            cloneable: true,
            chipType: "HITAG1",
            testBlade: "B103",
            frequency: "433MHz",
            batteryType: "None"
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "BMW X5 Smart Key",
          model: "BMW-868MHz",
          price: "249.99",
          oldPrice: null,
          imageUrl: "/sample-key-1.png",
          category: "Car Keys",
          description: "Smart key for BMW X5 2019-2023",
          shortDescription: "Smart key for BMW X5",
          sku: "BMW-X5-SMART",
          itemNumber: "BMW-X5-SMART",
          ezNumber: "BMW-X5-SMART",
          manufacturer: "BMW",
          stock: 8,
          lowStockAmount: 2,
          status: "active",
          isFeatured: true,
          visibility: "visible",
          weight: 0.12,
          dimensions: { length: 9, width: 3.5, height: 1.2 },
          allowReviews: true,
          purchaseNote: "",
          salePrice: null,
          regularPrice: "249.99",
          categories: ["BMW", "SUV", "Smart Keys"],
          tags: "bmw,x5,suv,smart,key,luxury",
          shippingClass: "",
          vehicleType: "SUV",
          brand: "BMW",
          year: 2021,
          keyType: "Smart Key",
          availability: "in-stock",
          compatibleModels: ["X5 2019-2023"],
          replacesKeyTypes: [],
          technicalSpecs: {
            reusable: false,
            cloneable: false,
            chipType: "HITAG3",
            testBlade: "B110",
            frequency: "868MHz",
            batteryType: "CR2032"
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Chevrolet Silverado Remote Key",
          model: "GM-13584512",
          price: "99.99",
          oldPrice: null,
          imageUrl: "/sample-key-2.png",
          category: "Car Keys",
          description: "Remote key for Chevrolet Silverado 2017-2022",
          shortDescription: "Remote key for Chevrolet Silverado",
          sku: "CHEVY-SILVERADO-REMOTE",
          itemNumber: "CHEVY-SILVERADO-REMOTE",
          ezNumber: "CHEVY-SILVERADO-REMOTE",
          manufacturer: "Chevrolet",
          stock: 20,
          lowStockAmount: 5,
          status: "active",
          isFeatured: false,
          visibility: "visible",
          weight: 0.09,
          dimensions: { length: 7.5, width: 2.8, height: 0.9 },
          allowReviews: true,
          purchaseNote: "",
          salePrice: null,
          regularPrice: "99.99",
          categories: ["Chevrolet", "Truck", "Remote Keys"],
          tags: "chevrolet,silverado,truck,remote,key",
          shippingClass: "",
          vehicleType: "Truck",
          brand: "Chevrolet",
          year: 2020,
          keyType: "Remote Key",
          availability: "in-stock",
          compatibleModels: ["Silverado 2017-2022"],
          replacesKeyTypes: [],
          technicalSpecs: {
            reusable: false,
            cloneable: true,
            chipType: "HITAG2",
            testBlade: "B105",
            frequency: "315MHz",
            batteryType: "CR2032"
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const product of sampleProducts) {
        await addDoc(collection(db, 'products'), product);
      }

      alert('Sample products added successfully! Your filter should now show options.');
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error adding sample products:', error);
      alert('Error adding sample products. Please check console for details.');
    }
    setLoading(false);
  };

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">
              {notification.type === 'success' ? '✓' : '✗'}
            </span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      {isAuthenticated ? (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Inventory Management</h1>
                                     <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1">
                     Total: {sortedProducts.length} products
                     {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                   </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowExportConfirmation(true)}
                    className="btn-mobile-compact w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-medium"
                  >
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                  </button>
                  <button
                    onClick={() => setShowFlexibleUploadModal(true)}
                    className="btn-mobile-compact w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-medium"
                  >
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Product
                  </button>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white border-b border-gray-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("");
                      setSelectedStatus("");
                    }}
                    className="w-full px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded text-xs transition"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-yellow-800 font-medium text-xs sm:text-sm">
                    {selectedProducts.length} product(s) selected
                  </span>
                  <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                    <button
                      onClick={() => setShowBulkTextRemoveModal(true)}
                      disabled={uploading || loading}
                      className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded transition disabled:opacity-50 text-xs"
                    >
                      Remove Text from Names
                    </button>
                    <button
                      onClick={() => setShowBulkCategoryModal(true)}
                      disabled={uploading || loading}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition disabled:opacity-50 text-xs"
                    >
                      Change Category
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={loading}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition disabled:opacity-50 text-xs"
                    >
                      {loading ? "Deleting..." : "Delete Selected"}
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded transition text-xs"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Product Table - Desktop */}
            <div className="hidden lg:block bg-white border border-gray-200 overflow-hidden admin-table">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={currentProducts.length > 0 && currentProducts.every(p => selectedProducts.includes(p.id))}
                          disabled={currentProducts.length === 0}
                          onChange={() => {}}
                          onClick={toggleSelectAll}
                          className="rounded border-gray-300 pointer-events-auto z-10 cursor-pointer focus:ring-blue-500"
                          style={{ pointerEvents: 'auto', zIndex: 1000 }}
                        />
                      </th>
                                             <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Image</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                       <th 
                         className="px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                         onClick={() => handleSort('sku')}
                       >
                         <div className="flex items-center gap-1">
                           SKU
                           {sortField === 'sku' && (
                             <span className="text-blue-600">
                               {sortDirection === 'asc' ? '↑' : '↓'}
                             </span>
                           )}
                         </div>
                       </th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Category</th>
                       <th 
                         className="px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                         onClick={() => handleSort('price')}
                       >
                         <div className="flex items-center gap-1">
                           Price
                           {sortField === 'price' && (
                             <span className="text-blue-600">
                               {sortDirection === 'asc' ? '↑' : '↓'}
                             </span>
                           )}
                         </div>
                       </th>
                       <th 
                         className="px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                         onClick={() => handleSort('stock')}
                       >
                         <div className="flex items-center gap-1">
                           Stock
                           {sortField === 'stock' && (
                             <span className="text-blue-600">
                               {sortDirection === 'asc' ? '↑' : '↓'}
                             </span>
                           )}
                         </div>
                       </th>
                       <th 
                         className="px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                         onClick={() => handleSort('status')}
                       >
                         <div className="flex items-center gap-1">
                           Status
                           {sortField === 'status' && (
                             <span className="text-blue-600">
                               {sortDirection === 'asc' ? '↑' : '↓'}
                             </span>
                           )}
                         </div>
                       </th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 admin-table-row">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => {}}
                            onClick={() => toggleProductSelection(product.id)}
                            className="rounded border-gray-300 pointer-events-auto z-10 cursor-pointer focus:ring-blue-500"
                            style={{ pointerEvents: 'auto', zIndex: 1000 }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <img 
                            src={getProductImage(product)} 
                            alt={product.title}
                            className="w-8 h-8 object-cover rounded border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/sample-key-1.png';
                            }}
                          />
                        </td>
                        <td 
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                          onDoubleClick={() => startEditing(product.id, 'title', product.title)}
                          title="Double-click to edit product name"
                        >
                          {editingCell?.productId === product.id && editingCell?.field === 'title' ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleInlineEditKeyDown}
                              onBlur={saveInlineEdit}
                              autoFocus
                              className="w-full px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={savingCell}
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-gray-900 text-xs">{product.title}</div>
                              <div className="text-xs text-gray-500">{product.model}</div>
                            </div>
                          )}
                        </td>
                        <td 
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                          onDoubleClick={() => startEditing(product.id, 'sku', product.sku || '')}
                          title="Double-click to edit SKU"
                        >
                          {editingCell?.productId === product.id && editingCell?.field === 'sku' ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleInlineEditKeyDown}
                              onBlur={saveInlineEdit}
                              autoFocus
                              className="w-20 px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={savingCell}
                            />
                          ) : (
                            <span className="text-xs text-gray-900">{product.sku || "-"}</span>
                          )}
                        </td>
                        <td 
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                          onDoubleClick={() => startEditing(product.id, 'category', product.categoryId || '')}
                          title="Double-click to edit category"
                        >
                          {editingCell?.productId === product.id && editingCell?.field === 'category' ? (
                            <select
                              value={editingValue}
                              onChange={(e) => handleSelectChange(e, 'category')}
                              onKeyDown={handleInlineEditKeyDown}
                              autoFocus
                              className="w-full px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={savingCell}
                            >
                              <option value="">No Category</option>
                              {availableCategories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getCategoryName(product.categoryId || "")}
                            </span>
                          )}
                        </td>
                        <td 
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                          onDoubleClick={() => startEditing(product.id, 'price', product.price)}
                          title="Double-click to edit price"
                        >
                          {editingCell?.productId === product.id && editingCell?.field === 'price' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">$</span>
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyDown}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-20 px-1 py-0.5 border border-blue-500 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                disabled={savingCell}
                              />
                              {savingCell && (
                                <span className="text-xs text-gray-500">Saving...</span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-green-600 text-xs">{formatPrice(product.price)}</div>
                              {product.oldPrice && (
                                <div className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td 
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                          onDoubleClick={() => startEditing(product.id, 'stock', product.stock || 0)}
                          title="Double-click to edit stock"
                        >
                          {editingCell?.productId === product.id && editingCell?.field === 'stock' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyDown}
                                onBlur={saveInlineEdit}
                                autoFocus
                                min="0"
                                className="w-16 px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                disabled={savingCell}
                              />
                              {savingCell && (
                                <span className="text-xs text-gray-500">Saving...</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-900">{product.stock || 0}</span>
                          )}
                        </td>
                        <td 
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                          onDoubleClick={() => startEditing(product.id, 'status', product.status || 'active')}
                          title="Double-click to edit status"
                        >
                          {editingCell?.productId === product.id && editingCell?.field === 'status' ? (
                            <select
                              value={editingValue}
                              onChange={(e) => handleSelectChange(e, 'status')}
                              onKeyDown={handleInlineEditKeyDown}
                              autoFocus
                              className="w-full px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={savingCell}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="out-of-stock">Out of Stock</option>
                              <option value="coming-soon">Coming Soon</option>
                            </select>
                          ) : (
                            <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                              product.status === 'active' ? 'bg-green-100 text-green-800' :
                              product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.status || 'active'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.imageUrl)}
                              disabled={loading}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  {loading ? "Loading products..." : "No products found"}
                </div>
              )}
            </div>

                      {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition disabled:opacity-50 text-xs"
                >
                  Previous
                </button>
                <span className="text-gray-700 text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition disabled:opacity-50 text-xs"
                >
                  Next
                </button>
              </div>
            )}

            {/* Product Cards - Mobile/Tablet */}
            <div className="lg:hidden space-y-2">
              {currentProducts.map(product => (
                <div key={product.id} className="bg-white border border-gray-200 p-2">
                  <div className="flex items-start gap-2">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => {}}
                        onClick={() => toggleProductSelection(product.id)}
                        className="rounded border-gray-300"
                      />
                    </div>
                    
                    {/* Product Image */}
                    <img 
                      src={getProductImage(product)} 
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded border flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/sample-key-1.png';
                      }}
                    />
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {editingCell?.productId === product.id && editingCell?.field === 'title' ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleInlineEditKeyDown}
                              onBlur={saveInlineEdit}
                              autoFocus
                              className="w-full px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
                              disabled={savingCell}
                            />
                          ) : (
                            <h3 
                              className="font-medium text-gray-900 text-xs truncate cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors"
                              onDoubleClick={() => startEditing(product.id, 'title', product.title)}
                              title="Double-click to edit product name"
                            >
                              {product.title}
                            </h3>
                          )}
                          <p className="text-xs text-gray-500">{product.model}</p>
                          {editingCell?.productId === product.id && editingCell?.field === 'sku' ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-gray-400">SKU:</span>
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyDown}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="flex-1 px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                disabled={savingCell}
                              />
                            </div>
                          ) : (
                            <p 
                              className="text-xs text-gray-400 mt-0.5 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors"
                              onDoubleClick={() => startEditing(product.id, 'sku', product.sku || '')}
                              title="Double-click to edit SKU"
                            >
                              SKU: {product.sku || "-"}
                            </p>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div 
                          className="text-right cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors"
                          onDoubleClick={() => startEditing(product.id, 'price', product.price)}
                          title="Double-click to edit price"
                        >
                          {editingCell?.productId === product.id && editingCell?.field === 'price' ? (
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-xs text-gray-500">$</span>
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyDown}
                                onBlur={saveInlineEdit}
                                autoFocus
                                className="w-16 px-1 py-0.5 border border-blue-500 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                disabled={savingCell}
                              />
                              {savingCell && (
                                <span className="text-xs text-gray-500">...</span>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-green-600 text-xs">{formatPrice(product.price)}</div>
                              {product.oldPrice && (
                                <div className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Status and Stock */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {editingCell?.productId === product.id && editingCell?.field === 'status' ? (
                            <select
                              value={editingValue}
                              onChange={(e) => handleSelectChange(e, 'status')}
                              onKeyDown={handleInlineEditKeyDown}
                              autoFocus
                              className="px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={savingCell}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="out-of-stock">Out of Stock</option>
                              <option value="coming-soon">Coming Soon</option>
                            </select>
                          ) : (
                            <span 
                              className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                                product.status === 'active' ? 'bg-green-100 text-green-800' :
                                product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}
                              onDoubleClick={() => startEditing(product.id, 'status', product.status || 'active')}
                              title="Double-click to edit status"
                            >
                              {product.status || 'active'}
                            </span>
                          )}
                          {editingCell?.productId === product.id && editingCell?.field === 'category' ? (
                            <select
                              value={editingValue}
                              onChange={(e) => handleSelectChange(e, 'category')}
                              onKeyDown={handleInlineEditKeyDown}
                              autoFocus
                              className="px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={savingCell}
                            >
                              <option value="">No Category</option>
                              {availableCategories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span 
                              className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 cursor-pointer hover:opacity-80 transition-opacity"
                              onDoubleClick={() => startEditing(product.id, 'category', product.categoryId || '')}
                              title="Double-click to edit category"
                            >
                              {getCategoryName(product.categoryId || "")}
                            </span>
                          )}
                          {editingCell?.productId === product.id && editingCell?.field === 'stock' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Stock:</span>
                              <input
                                type="number"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={handleInlineEditKeyDown}
                                onBlur={saveInlineEdit}
                                autoFocus
                                min="0"
                                className="w-12 px-1 py-0.5 border border-blue-500 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                disabled={savingCell}
                              />
                              {savingCell && (
                                <span className="text-xs text-gray-500">...</span>
                              )}
                            </div>
                          ) : (
                            <span 
                              className="text-xs text-gray-500 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors"
                              onDoubleClick={() => startEditing(product.id, 'stock', product.stock || 0)}
                              title="Double-click to edit stock"
                            >
                              Stock: {product.stock || 0}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 mt-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="btn-mobile-compact flex-1 px-1 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded transition"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id, product.imageUrl)}
                          disabled={loading}
                          className="btn-mobile-compact flex-1 px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded transition disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-4 text-gray-500 bg-white border border-gray-200 text-sm">
                  {loading ? "Loading products..." : "No products found"}
                </div>
              )}

            {/* Pagination for Mobile */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition disabled:opacity-50 text-xs"
                >
                  Previous
                </button>
                <span className="text-gray-700 text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition disabled:opacity-50 text-xs"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Add/Edit Product Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2 admin-modal" onClick={handleCloseModal} style={{ pointerEvents: 'auto' }}>
              <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[98vh] overflow-hidden admin-form animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>
                <FlexibleProductForm
                  onSubmit={handleUpdate}
                  onCancel={handleCloseModal}
                  initialData={editingProduct}
                  isEditing={true}
                  uploading={uploading}
                  nextAvailableSKU={getNextAvailableSKU()}
                />
              </div>
            </div>
          )}

          {/* Flexible Add Product Modal */}
          {showFlexibleUploadModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2 admin-modal" onClick={() => setShowFlexibleUploadModal(false)} style={{ pointerEvents: 'auto' }}>
              <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[98vh] overflow-hidden admin-form animate-scale-in flex flex-col" onClick={e => e.stopPropagation()} style={{ willChange: 'auto', contain: 'layout style paint' }}>
                <FlexibleProductForm
                  onSubmit={handleFlexibleUploadAndAdd}
                  onCancel={() => setShowFlexibleUploadModal(false)}
                  uploading={uploading}
                  nextAvailableSKU={getNextAvailableSKU()}
                />
              </div>
            </div>
          )}

          {/* Bulk Category Update Modal */}
          {showBulkCategoryModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowBulkCategoryModal(false)} style={{ pointerEvents: 'auto' }}>
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 flex-shrink-0 border-b">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Change Category for {selectedProducts.length} Product(s)</h3>
                  <p className="text-sm text-gray-600">
                    Select a category at any level to assign to all selected products.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {/* Recursive Category Tree */}
                  <CategoryTreeSelector
                    categories={availableCategories}
                    selectedCategoryId={bulkCategoryId}
                    onSelect={handleBulkCategorySelect}
                    level={0}
                  />
                </div>

                {/* Selected Category Display */}
                {bulkCategoryId && (
                  <div className="px-4 sm:px-6 pb-4 flex-shrink-0">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Selected Category:</span>{' '}
                        {getCategoryName(bulkCategoryId)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 p-4 sm:p-6 border-t flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowBulkCategoryModal(false);
                      setBulkCategoryId('');
                      setBulkSelectedPath([]);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkCategoryUpdate}
                    disabled={!bulkCategoryId || uploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? 'Updating...' : `Update ${selectedProducts.length} Product(s)`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Text Remove Modal */}
          {showBulkTextRemoveModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowBulkTextRemoveModal(false)} style={{ pointerEvents: 'auto' }}>
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Remove Text from {selectedProducts.length} Product Name(s)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the text you want to remove from all selected product titles. This will remove all occurrences (case-insensitive).
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text to Remove:
                  </label>
                  <input
                    type="text"
                    value={textToRemove}
                    onChange={(e) => setTextToRemove(e.target.value)}
                    placeholder="e.g., BRK, —BRK, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: Type &quot;brk&quot; to remove &quot;BRK&quot;, &quot;brk&quot;, &quot;—BRK&quot;, etc. from all selected product names.
                  </p>
                </div>
                
                {textToRemove.trim() && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Preview:</span> The text &quot;<span className="font-mono bg-orange-100 px-1 rounded">{textToRemove}</span>&quot; will be removed from all {selectedProducts.length} selected product title(s).
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowBulkTextRemoveModal(false);
                      setTextToRemove('');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkTextRemove}
                    disabled={!textToRemove.trim() || uploading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded transition disabled:opacity-50"
                  >
                    {uploading ? 'Removing...' : `Remove from ${selectedProducts.length} Product(s)`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Confirmation Modal */}
          {showExportConfirmation && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowExportConfirmation(false)} style={{ pointerEvents: 'auto' }}>
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Export Inventory Data?</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6">
                    This will export {sortedProducts.length} products to an HTML file with Image, Product Name, Price, and SKU. The file will include actual product images. Do you want to continue?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                    <button
                      onClick={() => setShowExportConfirmation(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded text-sm transition-colors"
                    >
                      No, Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowExportConfirmation(false);
                        exportToExcel();
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded text-sm transition-colors"
                    >
                      Yes, Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          </div>
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
}

export default function AdminInventory() {
  return (
    <AdminProvider>
      <AdminInventoryContent />
    </AdminProvider>
  );
} 