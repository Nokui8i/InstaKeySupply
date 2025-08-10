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
import getCroppedImg from "./utils/cropImage";

import { useAdminAuth } from "../context/AdminAuthContext";
import AdminLayout from "../layout";

interface Banner {
  id: string;
  imageUrl: string;
  alt: string;
}

function AdminBannersContent() {
  const [banners, setBanners] = useState<Banner[]>([]);
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
  const cropAspect = 16 / 5;

  async function fetchBanners() {
    const q = query(collection(db, "banners"), orderBy("imageUrl"));
    const snap = await getDocs(q);
    setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
  }

  useEffect(() => { 
    fetchBanners(); 
  }, []);

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
    if (!selectedFile || !croppedAreaPixels) return;
    setUploading(true);
    // Crop image
    const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
    // Upload to Storage
    const storageRef = ref(storage, `banners/${Date.now()}_${selectedFile.name}`);
    await uploadBytes(storageRef, croppedBlob);
    const downloadURL = await getDownloadURL(storageRef);
    // Save to Firestore
    await addDoc(collection(db, "banners"), {
      imageUrl: downloadURL
    });
    setSelectedFile(null); 
    setPreviewUrl(""); 
    setCropping(false);
    setShowUploadModal(false);
    await fetchBanners();
    setUploading(false);
  }

  async function handleDelete(id: string, imageUrl: string) {
    setLoading(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "banners", id));
      
      // Delete from Firebase Storage
      if (imageUrl) {
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
      }
      
      await fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Banner Management</h1>
                <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1">
                  Total: {banners.length} banners
                </p>
              </div>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded flex items-center justify-center gap-1 text-xs font-medium"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Banner
              </button>
            </div>
          </div>

          {/* Banner Grid */}
          <div className="p-3 sm:p-6">
            {banners.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">No banners uploaded yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Banner" to upload your first banner.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 w-full">
                                 {banners.map(banner => (
                                       <div key={banner.id} className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 flex flex-col gap-3 relative">
                      <button 
                        className="absolute top-1 -right-1 text-gray-600 hover:text-red-600 transition-all duration-200 disabled:opacity-50 z-10"
                        onClick={() => handleDelete(banner.id, banner.imageUrl)} 
                        disabled={loading}
                        title="Delete banner"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <div className="w-full aspect-[16/5] bg-gray-100 rounded overflow-hidden border">
                        <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                      </div>
                    </div>
                 ))}
              </div>
            )}
          </div>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
              <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Upload Banner</h3>
                  <button 
                    onClick={handleCloseModal}
                    disabled={uploading}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-3 sm:p-6">
                  {/* Upload Dropzone */}
                  {!selectedFile && (
                    <div className="mb-4 sm:mb-6">
                      <Dropzone onDrop={onDrop} accept={{"image/*": []}} multiple={false}>
                        {({ getRootProps, getInputProps }) => (
                          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:bg-gray-100 transition flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-full">
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="text-gray-600 font-medium text-sm sm:text-base">Drag &amp; drop banner image here, or <span className="underline text-blue-600">tap to select</span></span>
                            </div>
                          </div>
                        )}
                      </Dropzone>
                    </div>
                  )}

                  {selectedFile && (
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">Selected file: <span className="font-medium text-blue-800">{selectedFile.name}</span></p>
                    </div>
                  )}

                  {/* Cropping/Preview UI */}
                  {cropping && previewUrl && (
                    <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden border border-gray-300 mb-4 sm:mb-6 flex items-center justify-center" style={{ height: '300px', minHeight: '250px' }}>
                      <Cropper
                        image={previewUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={16/5}
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
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-24 sm:w-32">
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
                                width: 14,
                                height: 14,
                              },
                              '& .MuiSlider-track': {
                                height: 2,
                              },
                              '& .MuiSlider-rail': {
                                height: 2,
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
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                    <button 
                      type="button"
                      onClick={handleCancelUpload}
                      disabled={uploading}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded shadow transition disabled:opacity-50 text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleUploadAndAdd}
                      disabled={uploading || !selectedFile || !croppedAreaPixels}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow transition disabled:opacity-50 text-xs sm:text-sm"
                    >
                      {uploading ? "Uploading..." : "Add Banner"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
                     )}
         </div>
       );
     }

export default function AdminBanners() {
  return (
    <AdminLayout>
      <AdminBannersContent />
    </AdminLayout>
  );
} 