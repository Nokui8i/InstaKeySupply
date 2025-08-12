"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp, 
  query, 
  orderBy,
  where,
  writeBatch
} from "firebase/firestore";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminLayout from "../layout";

interface Discount {
  id?: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  startDate?: Timestamp;
  hasStartDate: boolean;
  endDate?: Timestamp;
  hasEndDate: boolean;
  active: boolean;
  applicableProducts: string[];
  applicableCategories: string[];
  applicableVehicles?: Array<{
    make: string;
    model?: string;
    year?: string;
    id: string;
  }>;
  usageLimit?: number;
  usedCount: number;
  customerLimit?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Product {
  id: string;
  title: string;
  price: string | number;
  category: string;
  categoryId: string;
  images?: string[];
  imageUrl?: string;
  discountInfo?: {
    discountId: string;
    discountName: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    originalPrice: string;
    discountedPrice: string;
    discountAmount: string;
    appliedAt: any;
  };
}

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

const DEFAULT_DISCOUNT: Discount = {
  name: "",
  type: "percentage",
  value: 10,
  startDate: undefined,
  hasStartDate: false,
  endDate: undefined,
  hasEndDate: false,
  active: false,
  applicableProducts: [],
  applicableCategories: [],
  applicableVehicles: [],
  usedCount: 0,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

export default function DiscountsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newDiscount, setNewDiscount] = useState<Discount>({ ...DEFAULT_DISCOUNT });
  const [formError, setFormError] = useState<string>("");
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [vehicleData, setVehicleData] = useState<any>({});
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedVehicles, setSelectedVehicles] = useState<Array<{
    make: string;
    model?: string;
    year?: string;
    id: string;
  }>>([]);
  const [loadingVehicleData, setLoadingVehicleData] = useState(true);
  const [selectionMethods, setSelectionMethods] = useState<Set<'category' | 'vehicle' | 'specific' | 'all'>>(new Set(['category']));

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchData();
      fetchVehicleData();
    }
  }, [isAuthenticated, authLoading]);



  const fetchVehicleData = async () => {
    setLoadingVehicleData(true);
    try {
      const res = await fetch('/api/vehicle-compatibility/makes-models');
      const json = await res.json();
      setVehicleData(json);
    } catch (e) {
      setVehicleData({});
    }
    setLoadingVehicleData(false);
  };

  const fetchData = async () => {
    setLoading(true);
    setMsg("");
    
    try {
      // Fetch discounts
      try {
        const discountQuery = query(collection(db, "discounts"), orderBy("createdAt", "desc"));
        const discountSnap = await getDocs(discountQuery);
        setDiscounts(discountSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discount)));
      } catch (error) {
        console.error("Error fetching discounts:", error);
        setDiscounts([]);
      }

      // Fetch products
      try {
        let productQuery;
        try {
          productQuery = query(collection(db, "products"), where("status", "==", "active"));
          const productSnap = await getDocs(productQuery);
          const activeProducts = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          console.log('Active products found:', activeProducts.length);
          setProducts(activeProducts);
        } catch (error) {
          console.log('No active products found, fetching all products...');
          productQuery = query(collection(db, "products"));
          const productSnap = await getDocs(productQuery);
          const allProducts = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          console.log('All products found:', allProducts.length);
          setProducts(allProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }

      // Fetch categories
      try {
        const categoryQuery = query(collection(db, "categories"));
        const categorySnap = await getDocs(categoryQuery);
        setCategories(categorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }

      setMsg("Data loaded successfully!");
      setTimeout(() => setMsg(""), 2000);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMsg("Error loading data. Please refresh the page.");
    }
    setLoading(false);
  };

  // Refresh discounts list to ensure we have latest data
  const refreshDiscounts = async () => {
    try {
      const discountQuery = query(collection(db, "discounts"), orderBy("createdAt", "desc"));
      const discountSnap = await getDocs(discountQuery);
      setDiscounts(discountSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discount)));
    } catch (error) {
      console.error("Error refreshing discounts:", error);
    }
  };

  // Validate discount data before saving
  const validateDiscountData = (data: any): boolean => {
    const requiredFields = ['name', 'type', 'value', 'active', 'hasStartDate', 'hasEndDate'];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Check for any remaining undefined values
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        console.error(`Found undefined value in field: ${key}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    setFormError("");
    
    if (!newDiscount.name.trim()) {
      setFormError("Discount name is required.");
      return;
    }
    if (!newDiscount.value || newDiscount.value <= 0) {
      setFormError("Discount value must be greater than 0.");
      return;
    }
    if (newDiscount.type === "percentage" && newDiscount.value > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }
             if (newDiscount.hasEndDate && newDiscount.endDate && newDiscount.hasStartDate && newDiscount.startDate && newDiscount.startDate >= newDiscount.endDate) {
      setFormError("End date must be after start date.");
      return;
    }
               // Validate based on selection methods
    if (selectionMethods.has('category') && newDiscount.applicableCategories.length === 0) {
      setFormError("Please select at least one category.");
      return;
    }
    
    if (selectionMethods.has('vehicle') && selectedVehicles.length === 0) {
      setFormError("Please select at least one vehicle.");
      return;
    }
    
    if (selectionMethods.has('specific') && newDiscount.applicableProducts.length === 0) {
      setFormError("Please select at least one specific product.");
      return;
    }
    
    // Ensure at least one method is selected
    if (selectionMethods.size === 0) {
      setFormError("Please select at least one method to apply the discount.");
      return;
    }

    setSaving(true);
    try {
      const { id, ...discountToSave } = newDiscount;
      
      // Handle "All Website" selection - include all products
      if (selectionMethods.has('all')) {
        const allProductIds = products.map(product => product.id);
        discountToSave.applicableProducts = allProductIds;
        discountToSave.applicableCategories = [];
        discountToSave.applicableVehicles = [];
      } else {
        // Combine products from multiple sources
        const allProductIds: string[] = [];
        
        // Add products from categories
        if (selectionMethods.has('category') && newDiscount.applicableCategories.length > 0) {
          console.log('Available products:', products.length);
          console.log('Selected categories:', newDiscount.applicableCategories);
          console.log('All products:', products.map(p => ({ id: p.id, title: p.title, categoryId: p.categoryId })));
          // Set the selected categories in discountToSave
          discountToSave.applicableCategories = [...newDiscount.applicableCategories];
          newDiscount.applicableCategories.forEach(categoryId => {
            const categoryProducts = products.filter(product => product.categoryId === categoryId);
            console.log(`Category ${categoryId} has ${categoryProducts.length} products:`, categoryProducts.map(p => ({ id: p.id, title: p.title })));
            allProductIds.push(...categoryProducts.map(product => product.id));
          });
        }
        
        // Add products from vehicles
        if (selectionMethods.has('vehicle') && selectedVehicles.length > 0) {
          discountToSave.applicableVehicles = [...selectedVehicles];
          const vehicleProductIds = getProductsByVehicle().map(product => product.id);
          allProductIds.push(...vehicleProductIds);
        }
        
        // Add specifically selected products
        if (selectionMethods.has('specific')) {
          allProductIds.push(...newDiscount.applicableProducts);
        }
        
        // Remove duplicates and set the combined list
        discountToSave.applicableProducts = [...new Set(allProductIds)];
        
        // Debug logging
        console.log('Products calculated from categories:', newDiscount.applicableCategories);
        console.log('All product IDs calculated:', allProductIds);
        console.log('Final applicableProducts:', discountToSave.applicableProducts);
      }
      
      // Comprehensive data cleanup - remove all undefined, null, and empty values
      discountToSave.name = discountToSave.name.trim();
      if (discountToSave.description) {
        discountToSave.description = discountToSave.description.trim();
      }
      discountToSave.active = Boolean(discountToSave.active);
      discountToSave.usedCount = discountToSave.usedCount || 0;
      discountToSave.updatedAt = Timestamp.now();
      
      // Clean up optional fields
      if (discountToSave.usageLimit === undefined || discountToSave.usageLimit === 0) {
        delete discountToSave.usageLimit;
      }
      if (discountToSave.customerLimit === undefined || discountToSave.customerLimit === 1) {
        delete discountToSave.customerLimit;
      }
      
      // Clean up date fields
      if (!discountToSave.hasStartDate || !discountToSave.startDate) {
        delete discountToSave.startDate;
      }
      if (!discountToSave.hasEndDate || !discountToSave.endDate) {
        delete discountToSave.endDate;
      }
      
      // Clean up arrays - ensure they're never undefined (but don't override calculated products)
      // Don't override applicableCategories - preserve what was selected
      if (!discountToSave.applicableCategories) {
        discountToSave.applicableCategories = [];
      }
      if (!discountToSave.applicableVehicles) {
        discountToSave.applicableVehicles = [];
      }
      
      // Clean up boolean fields
      discountToSave.hasStartDate = Boolean(discountToSave.hasStartDate);
      discountToSave.hasEndDate = Boolean(discountToSave.hasEndDate);
      discountToSave.active = Boolean(discountToSave.active);
      
      // Clean up numeric fields
      if (typeof discountToSave.value !== 'number' || isNaN(discountToSave.value)) {
        discountToSave.value = 10; // Default value
      }
      
            // Recursive cleanup function to remove all undefined values
      const deepCleanup = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(item => deepCleanup(item)).filter(item => item !== undefined);
        } else if (obj && typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              cleaned[key] = deepCleanup(value);
            }
          }
          return cleaned;
        }
        return obj;
      };
      
      // Apply deep cleanup
      const cleanedDiscount = deepCleanup(discountToSave);
      Object.assign(discountToSave, cleanedDiscount);
      
      // Remove any remaining undefined values
      Object.keys(discountToSave).forEach(key => {
        if (discountToSave[key as keyof typeof discountToSave] === undefined) {
          delete discountToSave[key as keyof typeof discountToSave];
        }
      });
      
      // Additional cleanup for specific fields that might cause issues
      if (discountToSave.description === "" || discountToSave.description === undefined) {
        delete (discountToSave as any).description;
      }
      
      // Ensure arrays are never undefined
      if (!discountToSave.applicableProducts) {
        discountToSave.applicableProducts = [];
      }
      if (!discountToSave.applicableCategories) {
        discountToSave.applicableCategories = [];
      }
      if (!discountToSave.applicableVehicles) {
        discountToSave.applicableVehicles = [];
      }
      

      

      
      // Validate data before saving
      if (!validateDiscountData(discountToSave)) {
        throw new Error('Invalid discount data detected. Please check the form and try again.');
      }
      
            // Always create new discount (no edit functionality)
      discountToSave.createdAt = Timestamp.now();
      

      
      const ref = await addDoc(collection(db, "discounts"), discountToSave);
      const newDiscountWithId = { ...newDiscount, id: ref.id };
      setDiscounts(discounts => [...discounts, newDiscountWithId]);
      setMsg("Discount created successfully!");
      
      // Directly update products with discount instead of calling API
      try {
        const batch = writeBatch(db);
        let updatedCount = 0;
        
        // Get the products that need updating - use the calculated product IDs
        console.log('Products to update filter:', discountToSave.applicableProducts);
        const productsToUpdate = products.filter(product => 
          discountToSave.applicableProducts.includes(product.id)
        );
        console.log('Products found for update:', productsToUpdate.length);
        
        productsToUpdate.forEach(product => {
          const currentPrice = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price) || 0;
          if (currentPrice <= 0) return;
          
          let discountedPrice = currentPrice;
          let discountAmount = 0;
          
          // Calculate discounted price
          if (newDiscount.type === 'percentage') {
            discountAmount = (currentPrice * newDiscount.value) / 100;
            discountedPrice = currentPrice - discountAmount;
          } else if (newDiscount.type === 'fixed') {
            discountAmount = Math.min(newDiscount.value, currentPrice);
            discountedPrice = currentPrice - discountAmount;
          }
          
          // Ensure price doesn't go below 0
          if (discountedPrice < 0) discountedPrice = 0;
          
          // Update product with discount
          batch.update(doc(db, 'products', product.id as string), {
            salePrice: discountedPrice.toFixed(2),
            regularPrice: currentPrice.toFixed(2),
            discountInfo: {
              discountId: ref.id,
              discountName: newDiscount.name,
              discountType: newDiscount.type,
              discountValue: newDiscount.value,
              originalPrice: currentPrice.toFixed(2),
              discountedPrice: discountedPrice.toFixed(2),
              discountAmount: discountAmount.toFixed(2),
              appliedAt: Timestamp.now()
            },
            updatedAt: Timestamp.now()
          });
          
          updatedCount++;
        });
        
        // Commit all updates
        await batch.commit();
        console.log(`Batch committed successfully. Updated ${updatedCount} products.`);
        
        // Refresh the discounts list to show updated data
        await refreshDiscounts();
        
        setMsg(`Discount created and applied to ${updatedCount} products successfully!`);
        
      } catch (applyError) {
        console.error('Error applying discount directly:', applyError);
        setMsg("Discount created but failed to apply to products.");
      }
      
      setNewDiscount({ ...DEFAULT_DISCOUNT });
      setSelectedVehicles([]);
      setSelectedMake("");
      setSelectedModel("");
      setSelectedYear("");
      setSelectionMethods(new Set(['category']));
      setTimeout(() => setMsg(""), 5000);
    } catch (error) {
      console.error('Discount save error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('No document to update')) {
          errorMessage = 'Discount not found. It may have been deleted. Please refresh the page and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setMsg(`Failed to save discount: ${errorMessage}`);
      setTimeout(() => setMsg(""), 5000);
    }
    setSaving(false);
  };



  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this discount? This action cannot be undone.")) return;
    
    try {
      // First, find the discount to get the product list
      const discountToDelete = discounts.find(d => d.id === id);
      if (!discountToDelete) {
        setMsg("Discount not found.");
        return;
      }
      
      // Remove discount from products before deleting the discount
      if (discountToDelete.applicableProducts && discountToDelete.applicableProducts.length > 0) {
        const batch = writeBatch(db);
        let updatedCount = 0;
        
        // Get products that have this discount applied
        const productsToUpdate = products.filter(product => 
          discountToDelete.applicableProducts.includes(product.id)
        );
        
        productsToUpdate.forEach(product => {
          // Restore original price and remove discount info
          batch.update(doc(db, 'products', product.id), {
            price: product.discountInfo?.originalPrice || product.price,
            salePrice: null,
            regularPrice: null,
            discountInfo: null,
            updatedAt: Timestamp.now()
          });
          updatedCount++;
        });
        
        // Commit the batch update
        await batch.commit();
        console.log(`Restored ${updatedCount} products to original prices`);
      }
      
      // Now delete the discount
      await deleteDoc(doc(db, "discounts", id));
      setDiscounts(discounts => discounts.filter(d => d.id !== id));
      setMsg(`Discount deleted and ${discountToDelete.applicableProducts?.length || 0} products restored to original prices.`);
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      console.error('Error deleting discount:', error);
      setMsg("Failed to delete discount. Please try again.");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const toggleDiscountStatus = async (discount: Discount) => {
    try {
      const newActiveStatus = !discount.active;
      
      if (!newActiveStatus) {
        // Deactivating - remove discount from products
        if (discount.applicableProducts && discount.applicableProducts.length > 0) {
          const batch = writeBatch(db);
          let updatedCount = 0;
          
          // Get products that have this discount applied
          const productsToUpdate = products.filter(product => 
            discount.applicableProducts.includes(product.id)
          );
          
          productsToUpdate.forEach(product => {
            // Restore original price and remove discount info
            const productData = product as any; // Type assertion for discountInfo
            batch.update(doc(db, 'products', product.id), {
              price: productData.discountInfo?.originalPrice || product.price,
              salePrice: null,
              regularPrice: null,
              discountInfo: null,
              updatedAt: Timestamp.now()
            });
            updatedCount++;
          });
          
          // Commit the batch update
          await batch.commit();
          console.log(`Deactivated discount: restored ${updatedCount} products to original prices`);
        }
      } else {
        // Activating - reapply discount to products
        if (discount.applicableProducts && discount.applicableProducts.length > 0) {
          const batch = writeBatch(db);
          let updatedCount = 0;
          
          // Get products that should have this discount applied
          const productsToUpdate = products.filter(product => 
            discount.applicableProducts.includes(product.id)
          );
          
          productsToUpdate.forEach(product => {
            const currentPrice = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price) || 0;
            if (currentPrice <= 0) return;
            
            let discountedPrice = currentPrice;
            let discountAmount = 0;
            
            // Calculate discounted price
            if (discount.type === 'percentage') {
              discountAmount = (currentPrice * discount.value) / 100;
              discountedPrice = currentPrice - discountAmount;
            } else if (discount.type === 'fixed') {
              discountAmount = Math.min(discount.value, currentPrice);
              discountedPrice = currentPrice - discountAmount;
            }
            
            // Ensure price doesn't go below 0
            if (discountedPrice < 0) discountedPrice = 0;
            
            // Update product with discount
            batch.update(doc(db, 'products', product.id), {
              salePrice: discountedPrice.toFixed(2),
              regularPrice: currentPrice.toFixed(2),
              discountInfo: {
                discountId: discount.id,
                discountName: discount.name,
                discountType: discount.type,
                discountValue: discount.value,
                originalPrice: currentPrice.toFixed(2),
                discountedPrice: discountedPrice.toFixed(2),
                discountAmount: discountAmount.toFixed(2),
                appliedAt: Timestamp.now()
              },
              updatedAt: Timestamp.now()
            });
            
            updatedCount++;
          });
          
          // Commit the batch update
          await batch.commit();
          console.log(`Activated discount: applied to ${updatedCount} products`);
        }
      }
      
      // Update discount status
      await updateDoc(doc(db, "discounts", discount.id!), {
        active: newActiveStatus,
        updatedAt: Timestamp.now()
      });
      
      setDiscounts(discounts => discounts.map(d => 
        d.id === discount.id ? { ...d, active: newActiveStatus } : d
      ));
      
      setMsg(`Discount ${newActiveStatus ? 'activated' : 'deactivated'} successfully.`);
      setTimeout(() => setMsg(""), 2000);
    } catch (error) {
      console.error('Error updating discount status:', error);
      setMsg("Failed to update discount status. Please try again.");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const applyDiscount = async (discountId: string) => {
    try {
      setMsg("Applying discount to products...");
      const response = await fetch('/api/apply-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMsg(result.message);
        await fetchData();
      } else {
        setMsg(`Failed to apply discount: ${result.error}`);
      }
      
      setTimeout(() => setMsg(""), 5000);
    } catch (error) {
      console.error('Error applying discount:', error);
      setMsg("Failed to apply discount. Please try again.");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const removeDiscount = async (discountId: string) => {
    try {
      setMsg("Removing discount from products...");
      const response = await fetch('/api/apply-discount', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMsg(result.message);
      } else {
        setMsg(`Failed to remove discount: ${result.error}`);
      }
      
      setTimeout(() => setMsg(""), 5000);
    } catch (error) {
      console.error('Error removing discount:', error);
      setMsg("Failed to remove discount. Please try again.");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const addProductToDiscount = (productId: string) => {
    if (!newDiscount.applicableProducts.includes(productId)) {
      setNewDiscount(prev => ({
        ...prev,
        applicableProducts: [...prev.applicableProducts, productId]
      }));
    }
  };

  const removeProductFromDiscount = (productId: string) => {
    setNewDiscount(prev => ({
      ...prev,
      applicableProducts: prev.applicableProducts.filter(id => id !== productId)
    }));
  };

  const addCategoryToDiscount = (categoryId: string) => {
    if (!newDiscount.applicableCategories.includes(categoryId)) {
      setNewDiscount(prev => ({
        ...prev,
        applicableCategories: [...prev.applicableCategories, categoryId]
      }));
    }
  };

  const removeCategoryFromDiscount = (categoryId: string) => {
    setNewDiscount(prev => ({
      ...prev,
      applicableCategories: prev.applicableCategories.filter(id => id !== categoryId)
    }));
  };

  const addVehicleToSelection = () => {
    if (!selectedMake) return;
    
    const newVehicle = {
      make: selectedMake,
      model: selectedModel || undefined,
      year: selectedYear || undefined,
      id: `${selectedMake}-${selectedModel || 'all'}-${selectedYear || 'all'}`
    };
    
    // Check if this vehicle combination already exists
    const exists = selectedVehicles.some(v => 
      v.make === selectedMake && 
      v.model === (selectedModel || undefined) && 
      v.year === (selectedYear || undefined)
    );
    
    if (!exists) {
      setSelectedVehicles(prev => [...prev, newVehicle]);
      // Reset form for next selection
      setSelectedMake("");
      setSelectedModel("");
      setSelectedYear("");
    }
  };

  const removeVehicleFromSelection = (vehicleId: string) => {
    setSelectedVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  // Calculate real-time product count based on current selections
  const getCurrentProductCount = () => {
    let totalCount = 0;
    
    if (selectionMethods.has('all')) {
      return products.length;
    }
    
    // Count products from categories
    if (selectionMethods.has('category') && newDiscount.applicableCategories.length > 0) {
      newDiscount.applicableCategories.forEach(categoryId => {
        totalCount += products.filter(product => product.categoryId === categoryId).length;
      });
    }
    
    // Count products from vehicles
    if (selectionMethods.has('vehicle') && selectedVehicles.length > 0) {
      totalCount += getProductsByVehicle().length;
    }
    
    // Count specifically selected products
    if (selectionMethods.has('specific')) {
      totalCount += newDiscount.applicableProducts.length;
    }
    
    return totalCount;
  };

     // Filter products based on search term and vehicle criteria
   const getFilteredProducts = () => {
     return products.filter(product => {
       // Search term filter
       const matchesSearch = product.title.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                            product.category.toLowerCase().includes(productSearchTerm.toLowerCase());
       
       if (!matchesSearch) return false;
       
       // Vehicle compatibility filter
       if (selectedMake || selectedModel || selectedYear) {
         // Check if product has vehicle compatibility data
         const productData = product as any;
         if (productData.selectedCompatibility && Array.isArray(productData.selectedCompatibility)) {
           return productData.selectedCompatibility.some((compatibility: any) => {
             let matches = true;
             
             if (selectedMake && compatibility.brand && !compatibility.brand.toLowerCase().includes(selectedMake.toLowerCase())) {
               matches = false;
             }
             
             if (selectedModel && compatibility.model && !compatibility.model.toLowerCase().includes(selectedModel.toLowerCase())) {
               matches = false;
             }
             
             if (selectedYear && compatibility.yearStart && compatibility.yearEnd) {
               const year = parseInt(selectedYear);
               const startYear = parseInt(compatibility.yearStart);
               const endYear = parseInt(compatibility.yearEnd);
               if (year < startYear || year > endYear) {
                 matches = false;
               }
             }
             
             return matches;
           });
         }
         return false; // No compatibility data
       }
       
       return true;
     });
   };

       // Get products by vehicle selection (for vehicle-based discounts)
    const getProductsByVehicle = () => {
      if (selectedVehicles.length === 0) return [];
      
      return products.filter(product => {
        const productData = product as any;
        if (productData.selectedCompatibility && Array.isArray(productData.selectedCompatibility)) {
          // Check if product matches ANY of the selected vehicles
          return selectedVehicles.some(vehicle => {
            return productData.selectedCompatibility.some((compatibility: any) => {
              let matches = true;
              
              // Must match the selected make
              if (compatibility.brand && !compatibility.brand.toLowerCase().includes(vehicle.make.toLowerCase())) {
                matches = false;
              }
              
              // If model is selected, must match the model
              if (vehicle.model && compatibility.model && !compatibility.model.toLowerCase().includes(vehicle.model.toLowerCase())) {
                matches = false;
              }
              
              // If year is selected, must match the year range
              if (vehicle.year && compatibility.yearStart && compatibility.yearEnd) {
                const year = parseInt(vehicle.year);
                const startYear = parseInt(compatibility.yearStart);
                const endYear = parseInt(compatibility.yearEnd);
                if (year < startYear || year > endYear) {
                  matches = false;
                }
              }
              
              return matches;
            });
          });
        }
        return false;
      });
    };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Not set';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const getDiscountStatus = (discount: Discount) => {
    const now = Timestamp.now();
    if (!discount.active) return "Inactive";
    if (discount.hasStartDate && discount.startDate && discount.startDate > now) return "Scheduled";
    if (discount.hasEndDate && discount.endDate && discount.endDate < now) return "Expired";
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) return "Limit Reached";
    return "Active";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Scheduled": return "bg-blue-100 text-blue-800";
      case "Expired": return "bg-red-100 text-red-800";
      case "Inactive": return "bg-gray-100 text-gray-800";
      case "Limit Reached": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h1>
              <p className="text-gray-600">Please wait while we verify your access.</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-4">You must be logged in as an administrator to access this page.</p>
              <p className="text-sm text-gray-500">Please log in with an admin account.</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto w-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Product Discounts</h1>
              <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1">
                Manage product-specific discounts and promotions
              </p>
            </div>

          </div>
        </div>

        {/* Main Content */}
        <div className="p-3 sm:p-6 pb-8">
          {/* Discount Form */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Create New Discount
              </h2>
            </div>
            
            <div className="space-y-4 sm:space-y-3">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-3">
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Discount Name *</label>
                   <input
                     type="text"
                     className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                     placeholder="e.g., Summer Sale 20% Off"
                     value={newDiscount.name}
                     onChange={(e) => setNewDiscount(prev => ({ ...prev, name: e.target.value }))}
                     maxLength={100}
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type *</label>
                   <select
                     className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                     value={newDiscount.type}
                     onChange={(e) => setNewDiscount(prev => ({ ...prev, type: e.target.value as any }))}
                   >
                     <option value="percentage">Percentage Off</option>
                     <option value="fixed">Fixed Amount Off</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">
                     {newDiscount.type === "percentage" ? "Percentage Off *" : "Amount Off *"}
                   </label>
                   <input
                     type="number"
                     className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                     value={newDiscount.value}
                     min={0}
                     max={newDiscount.type === "percentage" ? 100 : undefined}
                     step={newDiscount.type === "percentage" ? 1 : 0.01}
                     onChange={(e) => setNewDiscount(prev => ({ ...prev, value: Number(e.target.value) }))}
                   />
                 </div>
               </div>

                                               {/* Duration Options */}
                <div className="space-y-3">
                  {/* Duration Type Selection */}
                  <div className="space-y-2">
                    {/* Duration Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (newDiscount.hasEndDate && !newDiscount.hasStartDate) {
                            // If end date is already set, turn it off
                            setNewDiscount(prev => ({ 
                              ...prev, 
                              hasEndDate: false,
                              endDate: undefined
                            }));
                          } else {
                            // Turn on end date only
                            setNewDiscount(prev => ({ 
                              ...prev, 
                              hasStartDate: false, 
                              hasEndDate: true,
                              startDate: undefined,
                              endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                            }));
                          }
                        }}
                        className={`flex items-center gap-1.5 p-1.5 border rounded transition-all ${
                          newDiscount.hasEndDate && !newDiscount.hasStartDate
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center ${
                          newDiscount.hasEndDate && !newDiscount.hasStartDate
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {newDiscount.hasEndDate && !newDiscount.hasStartDate && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01 1.414-1.414L8 12.586l7.293-7.293a1 1 0 01 1.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-medium">Set End Date</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (newDiscount.hasStartDate && newDiscount.hasEndDate) {
                            // If scheduled is already set, turn it off
                            setNewDiscount(prev => ({ 
                              ...prev, 
                              hasStartDate: false,
                              hasEndDate: false,
                              startDate: undefined,
                              endDate: undefined
                            }));
                          } else {
                            // Turn on scheduled (both start and end)
                            setNewDiscount(prev => ({ 
                              ...prev, 
                              hasStartDate: true, 
                              hasEndDate: true,
                              startDate: Timestamp.now(),
                              endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                            }));
                          }
                        }}
                        className={`flex items-center gap-1.5 p-1.5 border rounded transition-all ${
                          newDiscount.hasStartDate && newDiscount.hasEndDate
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center ${
                          newDiscount.hasStartDate && newDiscount.hasEndDate
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {newDiscount.hasStartDate && newDiscount.hasEndDate && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01 1.414-1.414L8 12.586l7.293-7.293a1 1 0 01 1.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-medium">Scheduled</span>
                      </button>
                    </div>
                  </div>

                  {/* Date Inputs - Only show when needed */}
                  {(newDiscount.hasStartDate || newDiscount.hasEndDate) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {newDiscount.hasStartDate && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                          <input
                            type="datetime-local"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            value={newDiscount.startDate ? new Date(newDiscount.startDate.seconds * 1000).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setNewDiscount(prev => ({ 
                              ...prev, 
                              startDate: Timestamp.fromDate(new Date(e.target.value)) 
                            }))}
                          />
                        </div>
                      )}
                      
                      {newDiscount.hasEndDate && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                          <input
                            type="datetime-local"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            value={newDiscount.endDate ? new Date(newDiscount.endDate.seconds * 1000).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setNewDiscount(prev => ({ 
                              ...prev, 
                              endDate: Timestamp.fromDate(new Date(e.target.value)) 
                            }))}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                             {/* Product Selection - Choose between Category, Vehicle, or Specific Items */}
                               <div className="border border-gray-200 rounded-lg p-3">
                                   <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Choose how to apply this discount:</h3>
                    
                    {/* Selection Method Options */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                         <button
                           type="button"
                           onClick={() => {
                             // If this method is already selected, deselect it
                             if (selectionMethods.has('category')) {
                               setSelectionMethods(prev => new Set([...prev].filter(m => m !== 'category')));
                             } else {
                               // If selecting a new method, clear others and select only this one
                               setSelectionMethods(new Set(['category']));
                             }
                           }}
                           className={`flex flex-col items-center gap-1.5 p-2 border-2 rounded-lg transition-all ${
                              selectionMethods.has('category')
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                              selectionMethods.has('category')
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectionMethods.has('category') && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01 1.414-1.414L8 12.586l7.293-7.293a1 1 0 01 1.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-medium">By Category</div>
                              <div className="text-xs text-gray-500">Select product categories</div>
                            </div>
                          </button>
                         
                                                   <button
                            type="button"
                            onClick={() => {
                              // If this method is already selected, deselect it
                              if (selectionMethods.has('vehicle')) {
                                setSelectionMethods(prev => new Set([...prev].filter(m => m !== 'vehicle')));
                              } else {
                                // If selecting a new method, clear others and select only this one
                                setSelectionMethods(new Set(['vehicle']));
                              }
                            }}
                            className={`flex flex-col items-center gap-1.5 p-2 border-2 rounded-lg transition-all ${
                              selectionMethods.has('vehicle')
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                              selectionMethods.has('vehicle')
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectionMethods.has('vehicle') && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium">By Vehicle</div>
                              <div className="text-xs text-gray-500">Select vehicle compatibility</div>
                            </div>
                          </button>
                         
                                                   <button
                            type="button"
                            onClick={() => {
                              // If this method is already selected, deselect it
                              if (selectionMethods.has('specific')) {
                                setSelectionMethods(prev => new Set([...prev].filter(m => m !== 'specific')));
                              } else {
                                // If selecting a new method, clear others and select only this one
                                setSelectionMethods(new Set(['specific']));
                              }
                            }}
                            className={`flex flex-col items-center gap-1.5 p-2 border-2 rounded-lg transition-all ${
                              selectionMethods.has('specific')
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                              selectionMethods.has('specific')
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectionMethods.has('specific') && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01 1.414-1.414L8 12.586l7.293-7.293a1 1 0 01 1.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium">Specific Items</div>
                              <div className="text-xs text-gray-500">Search & select products</div>
                            </div>
                          </button>
                          
                                                     <button
                             type="button"
                             onClick={() => {
                               // If this method is already selected, deselect it
                               if (selectionMethods.has('all')) {
                                 setSelectionMethods(prev => new Set([...prev].filter(m => m !== 'all')));
                               } else {
                                 // If selecting a new method, clear others and select only this one
                                 setSelectionMethods(new Set(['all']));
                               }
                             }}
                             className={`flex flex-col items-center gap-1.5 p-2 border-2 rounded-lg transition-all ${
                               selectionMethods.has('all')
                                 ? 'border-blue-500 bg-blue-50 text-blue-700'
                                 : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                             }`}
                           >
                             <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                               selectionMethods.has('all')
                                 ? 'border-blue-500 bg-blue-500'
                                 : 'border-gray-300'
                             }`}>
                               {selectionMethods.has('all') && (
                                 <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01 1.414-1.414L8 12.586l7.293-7.293a1 1 0 01 1.414 0z" clipRule="evenodd" />
                                 </svg>
                               )}
                             </div>
                             <div className="text-center">
                               <div className="text-xs font-medium">All Website</div>
                               <div className="text-xs text-gray-500">Apply to every product</div>
                             </div>
                             
                             {/* Toggle for All Website */}
                             {selectionMethods.has('all') && (
                               <div className="mt-2">
                                                 <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewDiscount(prev => ({ ...prev, active: !prev.active }));
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className={`w-6 h-3 rounded-full transition-colors ${
                    newDiscount.active ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform transform ${
                      newDiscount.active ? 'translate-x-3' : 'translate-x-0'
                    }`}></div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {newDiscount.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                               </div>
                             )}
                           </button>
                        </div>
                        

                        

                        

                 </div>

                  

                   {/* Category Selection */}
                  {selectionMethods.has('category') && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Select Categories</h4>
                      </div>
                      
                      {newDiscount.applicableCategories.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-2">Selected Categories ({newDiscount.applicableCategories.length}):</div>
                          <div className="flex flex-wrap gap-2">
                            {newDiscount.applicableCategories.map(categoryId => {
                              const category = getCategoryById(categoryId);
                              return category ? (
                                                                 <div key={categoryId} className="flex items-center gap-2 bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs">
                                   <span>{category.name}</span>
                                   <button
                                     type="button"
                                     onClick={() => removeCategoryFromDiscount(categoryId)}
                                     className="text-blue-600 hover:text-blue-800"
                                   >
                                     ×
                                   </button>
                                 </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                       <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                         <div className="grid grid-cols-1 gap-2">
                           {categories.map(category => (
                             <div key={category.id} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <button
                                   type="button"
                                   onClick={() => {
                                     if (newDiscount.applicableCategories.includes(category.id)) {
                                       removeCategoryFromDiscount(category.id);
                                     } else {
                                       addCategoryToDiscount(category.id);
                                     }
                                   }}
                                                                       className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${
                                      newDiscount.applicableCategories.includes(category.id)
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                 >
                                   {newDiscount.applicableCategories.includes(category.id) && (
                                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01 1.414-1.414L8 12.586l7.293-7.293a1 1 0 01 1.414 0z" clipRule="evenodd" />
                                     </svg>
                                   )}
                                 </button>
                                 <span className="text-sm text-gray-700 cursor-pointer" onClick={() => {
                                   if (newDiscount.applicableCategories.includes(category.id)) {
                                     removeCategoryFromDiscount(category.id);
                                   } else {
                                     addCategoryToDiscount(category.id);
                                   }
                                 }}>
                                   {category.name}
                                 </span>
                               </div>
                               <span className="text-xs text-gray-500">
                                 {products.filter(p => p.categoryId === category.id).length} products
                               </span>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>
                  )}

                                                                       {/* Vehicle Selection */}
                   {selectionMethods.has('vehicle') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Select Vehicle Compatibility</h4>
                        <div className="text-xs text-gray-500">
                          Add multiple vehicle combinations to include ALL products compatible with those vehicles
                        </div>
                      </div>
                      
                      {/* Selected Vehicles Display */}
                      {selectedVehicles.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-700 mb-2">Selected Vehicles ({selectedVehicles.length}):</div>
                          <div className="space-y-2">
                            {selectedVehicles.map(vehicle => (
                              <div key={vehicle.id} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">{vehicle.make}</span>
                                  {vehicle.model && ` - ${vehicle.model}`}
                                  {vehicle.year && ` (${vehicle.year})`}
                                  {!vehicle.model && !vehicle.year && ' - All models and years'}
                                  {vehicle.model && !vehicle.year && ' - All years'}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVehicleFromSelection(vehicle.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Vehicle Selection Form */}
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="text-xs font-medium text-gray-700 mb-3">Add New Vehicle:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Make *</label>
                            <select
                              value={selectedMake}
                              onChange={(e) => {
                                setSelectedMake(e.target.value);
                                setSelectedModel("");
                                setSelectedYear("");
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select Make</option>
                              {Object.keys(vehicleData).sort().map(make => (
                                <option key={make} value={make}>{make}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Model (Optional)</label>
                            <select
                              value={selectedModel}
                              onChange={(e) => {
                                setSelectedModel(e.target.value);
                                setSelectedYear("");
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={!selectedMake}
                            >
                              <option value="">All Models</option>
                              {selectedMake && vehicleData[selectedMake] && Object.keys(vehicleData[selectedMake]).map(model => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Year Range (Optional)</label>
                            <select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={!selectedModel}
                            >
                              <option value="">All Years</option>
                              {selectedMake && selectedModel && vehicleData[selectedMake] && vehicleData[selectedMake][selectedModel] && vehicleData[selectedMake][selectedModel].map((yearRange: string) => (
                                <option key={yearRange} value={yearRange}>{yearRange}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={addVehicleToSelection}
                            disabled={!selectedMake}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition disabled:cursor-not-allowed"
                          >
                            Add Vehicle
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMake("");
                              setSelectedModel("");
                              setSelectedYear("");
                            }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                          >
                            Clear Form
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                                   {/* Specific Items Selection */}
                  {selectionMethods.has('specific') && (
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <h4 className="text-sm font-medium text-gray-700">Select Specific Products</h4>
                       <button
                         type="button"
                         onClick={() => setShowProductSelector(!showProductSelector)}
                         className="text-sm text-blue-600 hover:text-blue-700"
                       >
                         {showProductSelector ? 'Hide' : 'Select Products'}
                       </button>
                     </div>
                     
                                           {/* Only show specifically selected products (not from categories/vehicles) */}
                      {(() => {
                        // Get products that were specifically selected (not from categories or vehicles)
                        const specificallySelectedProducts = newDiscount.applicableProducts.filter(productId => {
                          const product = getProductById(productId);
                          if (!product) return false;
                          
                          // Check if this product was added from category selection
                          if (selectionMethods.has('category') && newDiscount.applicableCategories.includes(product.categoryId)) {
                            return false;
                          }
                          
                          // Check if this product was added from vehicle selection
                          if (selectionMethods.has('vehicle') && selectedVehicles.length > 0) {
                            const vehicleProducts = getProductsByVehicle();
                            if (vehicleProducts.some(p => p.id === productId)) {
                              return false;
                            }
                          }
                          
                          return true;
                        });
                        
                        if (specificallySelectedProducts.length > 0) {
                          return (
                            <div className="mb-3">
                              <div className="text-xs text-gray-600 mb-2">Specifically Selected Products ({specificallySelectedProducts.length}):</div>
                              <div className="flex flex-wrap gap-2">
                                {specificallySelectedProducts.map(productId => {
                                  const product = getProductById(productId);
                                  return product ? (
                                    <div key={productId} className="flex items-center gap-2 bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs">
                                      <span>{product.title}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeProductFromDiscount(productId)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                                           {showProductSelector && (
                        <div className="border border-gray-200 rounded-lg p-3">
                          {/* Search Input */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Search Products</label>
                            <input
                              type="text"
                              placeholder="Search by product name or category..."
                              value={productSearchTerm}
                              onChange={(e) => setProductSearchTerm(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Products List - Only show after search */}
                          {productSearchTerm.trim() ? (
                            <div className="max-h-60 overflow-y-auto">
                              <div className="text-xs text-gray-500 mb-2">
                                Showing {getFilteredProducts().length} of {products.length} products
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {getFilteredProducts().map(product => (
                                  <div key={product.id} className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (newDiscount.applicableProducts.includes(product.id)) {
                                          removeProductFromDiscount(product.id);
                                        } else {
                                          addProductToDiscount(product.id);
                                        }
                                      }}
                                      className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${
                                        newDiscount.applicableProducts.includes(product.id)
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-300 hover:border-blue-400'
                                      }`}
                                    >
                                      {newDiscount.applicableProducts.includes(product.id) && (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01 1.414-1.414L8 12.586l7.293-7.293a1 1 0 01 1.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </button>
                                    <span className="text-sm text-gray-700 cursor-pointer" onClick={() => {
                                      if (newDiscount.applicableProducts.includes(product.id)) {
                                        removeProductFromDiscount(product.id);
                                      } else {
                                        addProductToDiscount(product.id);
                                      }
                                    }}>
                                      {product.title} - ${product.price}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {getFilteredProducts().length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-xs">
                                  No products match your search.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400 text-xs">
                              Start typing to search for products...
                            </div>
                          )}
                        </div>
                      )}
                   </div>
                 )}

                 {/* All Website Selection */}
                 {selectionMethods.has('all') && (
                   <div className="space-y-3">
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                       <div className="flex items-center gap-2 mb-2">
                         <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                         </svg>
                         <h4 className="text-sm font-medium text-blue-800">All Website</h4>
                       </div>
                     </div>
                   </div>
                 )}
               </div>



              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
                  onClick={handleSave}
                  disabled={saving || !newDiscount.name || !newDiscount.value}
                >
                  {saving ? 'Saving...' : 'Create Discount'}
                </button>
              </div>
              
              {msg && <div className="text-center text-green-700 font-medium text-sm mt-2">{msg}</div>}
            </div>
          </div>

          {/* Discounts List */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Discounts</h2>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">Loading discounts...</p>
              </div>
            ) : discounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No discounts found.</p>
                <p className="text-xs text-gray-400 mt-1">Create your first discount above.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount Details</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {discounts.map(discount => (
                      <tr key={discount.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getDiscountStatus(discount))}`}>
                                  {getDiscountStatus(discount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {discount.type === "percentage" ? `${discount.value}% Off` : 
                             discount.type === "fixed" ? `$${discount.value} Off` : 
                             `Buy X Get Y`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {discount.type === "percentage" ? 'Percentage Discount' : 
                             discount.type === "fixed" ? 'Fixed Amount' : 'Special Offer'}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {!discount.hasStartDate && !discount.hasEndDate ? 'Infinite' :
                             discount.hasStartDate && discount.hasEndDate ? 'Scheduled' :
                             discount.hasEndDate ? 'End Date Only' :
                             discount.hasStartDate ? 'Start Date Only' : 'Not Set'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {discount.hasStartDate && discount.startDate && formatDate(discount.startDate)}
                            {discount.hasStartDate && discount.hasEndDate && discount.startDate && discount.endDate && ' - '}
                            {discount.hasEndDate && discount.endDate && formatDate(discount.endDate)}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {discount.applicableProducts.length} products
                          </div>
                          <div className="text-xs text-gray-500">
                            {discount.applicableCategories.length} categories
                          </div>

                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {discount.usedCount} uses
                          </div>
                          {discount.usageLimit && (
                            <div className="text-xs text-gray-500">
                              Limit: {discount.usageLimit}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col gap-1">

                            <button
                              onClick={() => toggleDiscountStatus(discount)}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                discount.active 
                                  ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200' 
                                  : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                              }`}
                            >
                              {discount.active ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                              onClick={() => handleDelete(discount.id!)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs rounded border border-red-200 transition-colors"
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
              
              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {discounts.map(discount => (
                  <div key={discount.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{discount.name}</div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getDiscountStatus(discount))}`}>
                            {getDiscountStatus(discount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Type</div>
                        <div className="font-medium">
                          {discount.type === "percentage" ? `${discount.value}% Off` : 
                           discount.type === "fixed" ? `$${discount.value} Off` : 
                           `Buy X Get Y`}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Duration</div>
                        <div className="font-medium">
                          {!discount.hasStartDate && !discount.hasEndDate ? 'Infinite' :
                           discount.hasStartDate && discount.hasEndDate ? 'Scheduled' :
                           discount.hasEndDate ? 'End Date Only' :
                           discount.hasStartDate ? 'Start Date Only' : 'Not Set'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Coverage</div>
                        <div className="font-medium">
                          {discount.applicableProducts.length} products
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Usage</div>
                        <div className="font-medium">
                          {discount.usedCount} uses
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => toggleDiscountStatus(discount)}
                        className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                          discount.active 
                            ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200' 
                            : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        {discount.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id!)}
                        className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded border border-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
