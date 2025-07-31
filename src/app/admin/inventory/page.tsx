"use client";
import React, { useEffect, useState } from "react";
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);
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
        console.log('Product compatibility data for', data.title, ':', data.compatibility);
        return { id: doc.id, ...data } as Product;
      });
      console.log('Fetched products from Firebase:', fetchedProducts);
      console.log('Product images data:', fetchedProducts.map(p => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        images: p.images
      })));
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
    const category = availableCategories.find(cat => cat.id === categoryId);
    return category ? category.name : "Car Keys";
  };

  useEffect(() => { 
    if (isAuthenticated) {
      fetchProducts();
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesStatus = !selectedStatus || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus]);

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
        console.log('Uploading images to Firebase:', formData.images.length, 'images');
        for (let i = 0; i < formData.images.length; i++) {
          const image = formData.images[i];
          console.log(`Processing image ${i + 1}:`, image.substring(0, 50) + '...');
          
          // If it's a base64 image (including edited images), upload it to Firebase Storage
          if (image.startsWith('data:')) {
            console.log(`Uploading base64 image ${i + 1} to Firebase Storage...`);
            try {
              const response = await fetch(image);
              const blob = await response.blob();
              const storageRef = ref(storage, `products/${Date.now()}_${i}_product.jpg`);
              await uploadBytes(storageRef, blob);
              const downloadUrl = await getDownloadURL(storageRef);
              console.log(`Image ${i + 1} uploaded successfully:`, downloadUrl);
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
            console.log(`Image ${i + 1} is already a URL:`, image);
            imageUrls.push(image);
          } else {
            console.warn(`Skipping invalid image ${i + 1}:`, image.substring(0, 50) + '...');
          }
        }
      }
      
      console.log('Final imageUrls array:', imageUrls);
      
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
        console.log('Uploading images to Firebase:', formData.images.length, 'images');
        for (let i = 0; i < formData.images.length; i++) {
          const image = formData.images[i];
          console.log(`Processing image ${i + 1}:`, image.substring(0, 50) + '...');
          
          // If it's a base64 image (including edited images), upload it to Firebase Storage
          if (image.startsWith('data:')) {
            console.log(`Uploading base64 image ${i + 1} to Firebase Storage...`);
            try {
              const response = await fetch(image);
              const blob = await response.blob();
              const storageRef = ref(storage, `products/${Date.now()}_${i}_product.jpg`);
              await uploadBytes(storageRef, blob);
              const downloadUrl = await getDownloadURL(storageRef);
              console.log(`Image ${i + 1} uploaded successfully:`, downloadUrl);
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
            console.log(`Image ${i + 1} is already a URL:`, image);
            imageUrls.push(image);
          } else {
            console.warn(`Skipping invalid image ${i + 1}:`, image.substring(0, 50) + '...');
          }
        }
      }
      
      console.log('Final imageUrls array:', imageUrls);
      
      console.log('Saving product with compatibility data:', formData.compatibility);
      
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
      categoryId: product.categoryId || "",
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
        compatibility: product.compatibility || [],
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
      
      console.log('Updating product with compatibility data:', formData.compatibility);
      
      const updateData: any = {
        title: formData.title,
        model: formData.model || "",
        price: formData.price,
        oldPrice: formData.oldPrice || null,
        imageUrl: imageUrls[0] || "", // Keep main image for backward compatibility
        images: imageUrls, // Store all images in array
        category: formData.category || "Car Keys",
        categoryId: formData.categoryId || null,
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
        updatedAt: new Date()
      };



      await updateDoc(doc(db, "products", editingProduct.id), updateData);
      
      console.log("Product updated successfully");
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

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSelection = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      return newSelection;
    });
  };

  // Toggle select all products
  const toggleSelectAll = () => {
    const allSelected = currentProducts.every(p => selectedProducts.includes(p.id));
    if (allSelected) {
      // If all are selected, clear selection
      setSelectedProducts([]);
    } else {
      // If not all are selected, select all
      setSelectedProducts(currentProducts.map(p => p.id));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedProducts([]);
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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-white/90 rounded-2xl shadow-2xl border border-blue-100 mt-4 mb-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">Inventory Management</h2>
              <p className="text-gray-600 mt-1">
                Total: {filteredProducts.length} products
                {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={addSampleProducts}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg px-3 py-2 shadow-sm hover:from-blue-700 hover:to-blue-600 hover:shadow-md transition-all duration-150 disabled:opacity-50 text-sm"
              >
                {loading ? "Adding..." : "Add Sample Products"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFlexibleUploadModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg px-3 py-2 shadow-sm hover:from-blue-700 hover:to-blue-600 hover:shadow-md transition-all duration-150 text-sm"
                >
                  Add Any Product
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-yellow-800 font-medium text-sm">
                  {selectedProducts.length} product(s) selected
                </span>
                <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
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
          <div className="hidden lg:block bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Image</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => {}}
                          onClick={() => toggleProductSelection(product.id)}
                          className="rounded border-gray-300 pointer-events-auto z-10 cursor-pointer focus:ring-blue-500"
                          style={{ pointerEvents: 'auto', zIndex: 1000 }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <img 
                          src={product.imageUrl} 
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-500">{product.model}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{product.sku || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getCategoryName(product.categoryId || "")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-green-600">{product.price}</div>
                          {product.oldPrice && (
                            <div className="text-sm text-gray-400 line-through">{product.oldPrice}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{product.stock || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' :
                          product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.imageUrl)}
                            disabled={loading}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition disabled:opacity-50"
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
              <div className="text-center py-8 text-gray-500">
                {loading ? "Loading products..." : "No products found"}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {/* Product Cards - Mobile/Tablet */}
          <div className="lg:hidden space-y-4">
            {currentProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="flex items-start gap-4">
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
                    src={product.imageUrl} 
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                  />
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.title}</h3>
                        <p className="text-sm text-gray-500">{product.model}</p>
                        <p className="text-xs text-gray-400 mt-1">SKU: {product.sku || "-"}</p>
                            </div>
                      
                      {/* Price */}
                      <div className="text-right">
                        <div className="font-medium text-green-600 text-sm sm:text-base">{product.price}</div>
                        {product.oldPrice && (
                          <div className="text-xs text-gray-400 line-through">{product.oldPrice}</div>
                        )}
                    </div>
                    </div>
                    
                    {/* Status and Stock */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' :
                          product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.status || 'active'}
                          </span>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getCategoryName(product.categoryId || "")}
                        </span>
                        <span className="text-xs text-gray-500">Stock: {product.stock || 0}</span>
                        </div>
                      </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                    <button 
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition"
                      >
                        Edit
                    </button>
                    <button 
                        onClick={() => handleDelete(product.id, product.imageUrl)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition disabled:opacity-50"
                      >
                        Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow border border-gray-200">
                {loading ? "Loading products..." : "No products found"}
              </div>
            )}

            {/* Pagination for Mobile */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-700 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Add/Edit Product Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={handleCloseModal} style={{ pointerEvents: 'auto' }}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <FlexibleProductForm
                  onSubmit={handleUpdate}
                  onCancel={handleCloseModal}
                  initialData={editingProduct}
                  isEditing={true}
                  uploading={uploading}
                />
              </div>
            </div>
          )}

          {/* Flexible Add Product Modal */}
          {showFlexibleUploadModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setShowFlexibleUploadModal(false)} style={{ pointerEvents: 'auto' }}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <FlexibleProductForm
                  onSubmit={handleFlexibleUploadAndAdd}
                  onCancel={() => setShowFlexibleUploadModal(false)}
                  uploading={uploading}
                />
              </div>
            </div>
          )}

        </div>
      ) : (
        <div>        </div>
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