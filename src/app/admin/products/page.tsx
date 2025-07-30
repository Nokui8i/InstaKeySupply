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
  orderBy
} from "firebase/firestore";
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Dropzone from "react-dropzone";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import getCroppedImg from "../banners/utils/cropImage";
import AdminLayout from "../layout";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminProvider from "../AdminProvider";

interface Product {
  id: string;
  title: string;
  model: string;
  price: string;
  oldPrice?: string;
  imageUrl: string;
  category?: string;
  description?: string;
}

function AdminProductsContent() {
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    model: "",
    price: "",
    oldPrice: "",
    category: "",
    description: ""
  });
  const cropAspect = 1; // Square aspect ratio for product images

  async function fetchProducts() {
    const q = query(collection(db, "products"), orderBy("title"));
    const snap = await getDocs(q);
    setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
  }

  useEffect(() => { 
    if (isAuthenticated) {
      fetchProducts(); 
    }
  }, [isAuthenticated]);

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
      description: ""
    });
    setShowUploadModal(false);
  };

  // Close modal
  const handleCloseModal = () => {
    if (!uploading) {
      handleCancelUpload();
    }
  };

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

  // Upload cropped image to Firebase Storage
  async function handleUploadAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !croppedAreaPixels || !formData.title || !formData.price) return;
    setUploading(true);
    
    try {
      // Crop image
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      // Upload to Storage
      const storageRef = ref(storage, `products/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, croppedBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save to Firestore
      await addDoc(collection(db, "products"), {
        title: formData.title,
        model: formData.model,
        price: formData.price,
        oldPrice: formData.oldPrice || null,
        imageUrl: downloadURL,
        category: formData.category || "Car Keys",
        description: formData.description || ""
      });
      
      setSelectedFile(null); 
      setPreviewUrl(""); 
      setCropping(false);
      setShowUploadModal(false);
      setFormData({
        title: "",
        model: "",
        price: "",
        oldPrice: "",
        category: "",
        description: ""
      });
      await fetchProducts();
    } catch (error) {
      console.error("Error uploading product:", error);
    }
    setUploading(false);
  }

  async function handleDelete(id: string, imageUrl: string) {
    setLoading(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "products", id));
      
      // Delete from Firebase Storage
      if (imageUrl) {
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
      }
      
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
    setLoading(false);
  }

  return (
    <AdminLayout>
      {isAuthenticated ? (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-white/90 rounded-2xl shadow-2xl border border-blue-100 mt-4 mb-24">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">Product Management</h2>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold rounded-lg px-4 py-2 shadow hover:from-blue-800 hover:to-blue-600 transition"
            >
              Add Product
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 w-full">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow border border-blue-100 p-4 sm:p-6 flex flex-col gap-4">
                <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border shadow-sm">
                  <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{product.title}</h3>
                  <p className="text-gray-600 text-sm">Model: {product.model}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600 text-lg">{product.price}</span>
                    {product.oldPrice && (
                      <span className="text-gray-400 line-through text-sm">{product.oldPrice}</span>
                    )}
                  </div>
                  {product.category && (
                    <span className="text-blue-600 text-sm font-medium">{product.category}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    className="w-full bg-gradient-to-r from-blue-200 to-blue-400 text-blue-900 font-semibold rounded-lg px-4 py-2 sm:px-3 sm:py-1 text-sm shadow hover:from-blue-300 hover:to-blue-500 hover:text-white transition border border-blue-200"
                    onClick={() => handleDelete(product.id, product.imageUrl)} 
                    disabled={loading}
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Add New Product</h3>
                  <button 
                    onClick={handleCloseModal}
                    disabled={uploading}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Product Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Ford F-Series 3-Button Remote Key"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model Number</label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., N5F-A08TBLP"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., $188.95"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Old Price (Optional)</label>
                      <input
                        type="text"
                        value={formData.oldPrice}
                        onChange={(e) => setFormData({...formData, oldPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., $199.99"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Car Keys"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Product description..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  {!selectedFile && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Image *</label>
                      <Dropzone onDrop={onDrop} accept={{'image/*': []}} multiple={false}>
                        {({ getRootProps, getInputProps }) => (
                          <div {...getRootProps()} className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 md:p-8 text-center cursor-pointer hover:bg-blue-50 transition flex flex-col items-center justify-center min-h-[120px] w-full">
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="text-gray-500 font-semibold text-base">Drag & drop product image here, or <span className='underline text-blue-700'>tap to select</span></span>
                            </div>
                          </div>
                        )}
                      </Dropzone>
                    </div>
                  )}

                  {selectedFile && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Selected file: <span className="font-medium text-blue-800">{selectedFile.name}</span></p>
                    </div>
                  )}

                  {/* Cropping/Preview UI */}
                  {cropping && previewUrl && (
                    <div className="relative w-full bg-gray-200 rounded-xl overflow-hidden border border-blue-200 shadow-inner mb-6 flex items-center justify-center" style={{ height: '400px', minHeight: '300px' }}>
                      <Cropper
                        image={previewUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        minZoom={minZoom}
                        maxZoom={3}
                        restrictPosition={true}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        style={{
                          containerStyle: {
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#f3f4f6'
                          }
                        }}
                      />
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32">
                        <div className="bg-white/95 backdrop-blur-sm rounded-full p-1 shadow-lg">
                          <Slider
                            min={minZoom}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={(_, value) => setZoom(value as number)}
                            size="small"
                            sx={{
                              '& .MuiSlider-thumb': {
                                width: 16,
                                height: 16,
                              },
                              '& .MuiSlider-track': {
                                height: 3,
                              },
                              '& .MuiSlider-rail': {
                                height: 3,
                              }
                            }}
                          />
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
                            Min: {minZoom.toFixed(1)}x
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Actions */}
                  <div className="flex gap-3 justify-end">
                    <button 
                      type="button"
                      onClick={handleCancelUpload}
                      disabled={uploading}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleUploadAndAdd}
                      disabled={uploading || !selectedFile || !croppedAreaPixels || !formData.title || !formData.price}
                      className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold rounded-lg shadow hover:from-blue-800 hover:to-blue-600 transition disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Add Product"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div></div>
      )}
    </AdminLayout>
  );
}

export default function AdminProducts() {
  return (
    <AdminProvider>
      <AdminProductsContent />
    </AdminProvider>
  );
} 