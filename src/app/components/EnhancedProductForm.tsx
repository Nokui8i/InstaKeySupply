'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface EnhancedProductFormProps {
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
  uploading?: boolean;
}

// Image Editor Component
function ImageEditor({ 
  imageSrc, 
  onSave, 
  onCancel 
}: { 
  imageSrc: string; 
  onSave: (editedImage: string) => void; 
  onCancel: () => void; 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Define the image loading functions outside useEffect so they can be called from UI
  const loadImage = async (src: string, useCORS: boolean = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsLoading(true);
    setLoadError(null);
    
    // If it's an external URL, we need to download it first
    if (src.startsWith('http') && !src.startsWith('data:')) {
      try {
        console.log('Downloading external image...');
        
        // Create a proxy request to avoid CORS issues
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`;
        
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Data = e.target?.result as string;
            console.log('Successfully downloaded image, size:', base64Data.length);
            setIsLoading(false);
            loadImageFromBase64(base64Data);
          };
          reader.readAsDataURL(blob);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.log('Proxy download failed, trying direct fetch...', error);
        
        // Try direct fetch as fallback
        try {
          const response = await fetch(src);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64Data = e.target?.result as string;
              console.log('Direct download successful, size:', base64Data.length);
              setIsLoading(false);
              loadImageFromBase64(base64Data);
            };
            reader.readAsDataURL(blob);
            return;
          }
        } catch (directError) {
          console.log('Direct download also failed, trying canvas approach...', directError);
        }
      }
    }
    
    // Direct loading approach for local images or as fallback
    loadImageDirectly(src, useCORS);
  };

  const loadImageDirectly = (src: string, useCORS: boolean = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    if (useCORS) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      if (canvas && ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        console.log('Image loaded successfully, canvas size:', canvas.width, 'x', canvas.height);
        setIsLoading(false);
      }
    };
    
    img.onerror = () => {
      if (useCORS) {
        console.log('CORS failed, trying without crossOrigin...');
        loadImageDirectly(src, false);
      } else {
        console.error('Image failed to load completely:', src);
        setIsLoading(false);
        setLoadError('Failed to load image. Please try a different image or upload from your computer.');
        // Show error message on canvas
        if (canvas && ctx) {
          canvas.width = 400;
          canvas.height = 300;
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#6b7280';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Failed to load image', canvas.width / 2, canvas.height / 2 - 20);
          ctx.fillText('Please try a different image', canvas.width / 2, canvas.height / 2 + 20);
        }
      }
    };
    
    img.src = src;
  };

  const loadImageFromBase64 = (base64Data: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      if (canvas && ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        console.log('Base64 image loaded successfully, canvas size:', canvas.width, 'x', canvas.height);
        setIsLoading(false);
      }
    };
    img.onerror = () => {
      console.error('Failed to load base64 image');
      setIsLoading(false);
      setLoadError('Failed to load downloaded image. Please try again.');
      loadImageDirectly(imageSrc, true);
    };
    img.src = base64Data;
  };

  useEffect(() => {
    loadImage(imageSrc);
  }, [imageSrc]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Starting to draw...');
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      // For external images, create a new canvas to avoid tainted canvas issues
      if (imageSrc.startsWith('http') && !imageSrc.startsWith('data:')) {
        console.log('Saving external image with new canvas approach...');
        
        const newCanvas = document.createElement('canvas');
        const newCtx = newCanvas.getContext('2d');
        if (!newCtx) {
          console.error('Could not get 2D context for new canvas');
          return;
        }
        
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        
        // Copy the current canvas content to the new canvas
        newCtx.drawImage(canvas, 0, 0);
        
        // Try to save from the new canvas
        try {
          const editedImage = newCanvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                console.log('Successfully saved external image via blob, size:', dataUrl.length);
                onSave(dataUrl);
              };
              reader.readAsDataURL(blob);
            } else {
              console.error('Blob creation failed');
              onSave(imageSrc);
            }
          }, 'image/jpeg', 0.95);
        } catch (blobError) {
          console.log('Blob method failed, trying dataURL...', blobError);
          const editedImage = newCanvas.toDataURL('image/jpeg', 0.95);
          console.log('Successfully saved external image via dataURL, size:', editedImage.length);
          onSave(editedImage);
        }
        return;
      }
      
      // For local images, try direct export first
      const editedImage = canvas.toDataURL('image/jpeg', 0.95);
      console.log('Saving local image, size:', editedImage.length);
      onSave(editedImage);
      
    } catch (error) {
      console.error('Error saving edited image:', error);
      
      // If canvas is tainted, use a different approach
      try {
        // Create a new canvas with the same dimensions
        const newCanvas = document.createElement('canvas');
        const newCtx = newCanvas.getContext('2d');
        if (!newCtx) {
          console.error('Could not get 2D context for new canvas');
          return;
        }
        
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        
        // Get the image data from the original canvas
        const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          console.error('Could not get image data from canvas');
          return;
        }
        
        // Put the image data on the new canvas
        newCtx.putImageData(imageData, 0, 0);
        
        // Now export from the new canvas
        const editedImage = newCanvas.toDataURL('image/jpeg', 0.8);
        console.log('Saving edited image via imageData, size:', editedImage.length);
        onSave(editedImage);
        
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        
        // Last resort: try to create a new canvas and redraw everything
        try {
          const newCanvas = document.createElement('canvas');
          const newCtx = newCanvas.getContext('2d');
          if (!newCtx) {
            throw new Error('Could not get 2D context');
          }
          
          newCanvas.width = canvas.width;
          newCanvas.height = canvas.height;
          
          // Create a new image from the original source
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            newCtx.drawImage(img, 0, 0);
            
            // Apply the same drawing operations that were done on the original canvas
            // This is a simplified approach - we'll just return the original for now
            console.log('Returning original image as fallback');
            onSave(imageSrc);
          };
          img.onerror = () => {
            console.log('Returning original image as fallback');
            onSave(imageSrc);
          };
          img.src = imageSrc;
          
        } catch (finalError) {
          console.error('All methods failed:', finalError);
          onSave(imageSrc);
        }
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // For external images, we need to reload the image to avoid tainted canvas issues
    if (imageSrc.startsWith('http') && !imageSrc.startsWith('data:')) {
      console.log('Clearing external image canvas...');
      loadImage(imageSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(fallbackImg, 0, 0);
      };
      fallbackImg.src = imageSrc;
    };
    
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Image</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Tools */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Tool:</label>
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value as 'brush' | 'eraser')}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="brush">Brush</option>
              <option value="eraser">Eraser</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Brush Size:</label>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm">{brushSize}px</span>
          </div>

          {tool === 'brush' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Color:</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 border rounded cursor-pointer"
              />
            </div>
          )}

          <button
            onClick={clearCanvas}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Reset
          </button>
        </div>

        {/* Canvas */}
        <div className="flex justify-center mb-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Downloading image...</p>
            </div>
          )}
          
          {loadError && (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">Error Loading Image</p>
                <p className="text-sm">{loadError}</p>
              </div>
              <button
                onClick={() => {
                  setLoadError(null);
                  setIsLoading(true);
                  // Reload the image
                  const canvas = canvasRef.current;
                  if (canvas) {
                    loadImage(imageSrc);
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          )}
          
          {!isLoading && !loadError && (
            <div className="border rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onMouseMove={draw}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    const mouseEvent = new MouseEvent('mousedown', {
                      clientX: touch.clientX,
                      clientY: touch.clientY
                    });
                    startDrawing(mouseEvent as any);
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing();
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    const mouseEvent = new MouseEvent('mousemove', {
                      clientX: touch.clientX,
                      clientY: touch.clientY
                    });
                    draw(mouseEvent as any);
                  }
                }}
                className="cursor-crosshair max-w-full max-h-[60vh] touch-none"
                style={{ maxWidth: '100%', maxHeight: '60vh' }}
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 mb-4">
          <p><strong>Brush:</strong> Paint over areas to hide them</p>
          <p><strong>Eraser:</strong> Remove painted areas</p>
          <p>Click and drag to paint. Use the color picker to match the background.</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EnhancedProductForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isEditing = false, 
  uploading = false 
}: EnhancedProductFormProps) {
  const [formData, setFormData] = useState({
    // Basic Product Information
    title: "",
    partNumber: "",
    manufacturer: "",
    
    // Pricing
    price: "",
    oldPrice: "",
    salePrice: "",
    regularPrice: "",
    
    // Categories and Classification
    category: "",
    categoryId: "",
    categories: [] as string[],
    vehicleTypes: [] as string[],
    
    // Stock and Status
    stock: "",
    lowStockAmount: "",
    status: "active",
    availability: "in-stock",
    isFeatured: false,
    visibility: "visible",
    
    // Descriptions
    shortDescription: "",
    description: "",
    
    // Images
    images: [] as string[],
    
    // Technical Specifications
    technicalSpecs: {
      fccId: "",
      can: "",
      frequency: "",
      batteryType: "",
      chipType: "",
      testBlade: "",
      buttons: [] as string[],
      buttonCount: 1,
      emergencyKeyIncluded: false,
      aftermarket: true,
      reusable: false,
      cloneable: false
    },
    
    // Product Type
    isOem: false,
    isAftermarket: false,
    oemPartNumber: "",
    aftermarketPartNumber: "",
    
    // Additional Information
    compatibleModels: [] as string[],
    replacesKeyTypes: [] as string[],
    warranty: "",
    returnPolicy: "",
    shippingInfo: "",
    installationNotes: "",
    
    // Physical Properties
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: ""
    },
    
    // Settings
    allowReviews: true,
    purchaseNote: "",
    tags: "",
    shippingClass: "",
    
    // Vehicle Information
    vehicleType: "Car",
    brand: "",
    year: "",
    keyType: "Remote Key",
    
    // Vehicle Compatibility
    selectedCompatibility: [] as Array<{
      brand: string;
      model: string;
      yearStart: string;
      yearEnd: string;
      keyTypes: string[];
    }>
  });

  // Image editor state
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingImageSrc, setEditingImageSrc] = useState<string>('');



  // Dynamic data from Firestore
  const [dynamicVehicleTypes, setDynamicVehicleTypes] = useState<Array<{id: string, name: string, isActive: boolean}>>([]);
  const [dynamicBrands, setDynamicBrands] = useState<Array<{id: string, name: string, vehicleTypeId?: string, isActive: boolean}>>([]);
  const [dynamicModels, setDynamicModels] = useState<Array<{id: string, brandId: string, name: string, keyTypes: string[], isActive: boolean}>>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Selection states for dropdowns
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYearStart, setSelectedYearStart] = useState("");
  const [selectedYearEnd, setSelectedYearEnd] = useState("");

  // Predefined options for dropdowns
  const keyTypes = ["Remote Key", "Smart Key", "Transponder Key", "Mechanical Key", "Proximity Key", "Fob"];
  const years = Array.from({ length: 30 }, (_, i) => 2024 - i);
  const buttonOptions = ["Lock", "Unlock", "Trunk", "Panic", "Start", "Stop", "Horn", "Lights"];
  const frequencyOptions = ["315MHz", "433MHz", "868MHz", "915MHz", "2.4GHz"];
  const batteryTypes = ["CR2016", "CR2025", "CR2032", "CR2450", "None"];

  // Initialize form data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      
      // If editing and there's existing compatibility data, parse it
      if (initialData.compatibility && Array.isArray(initialData.compatibility)) {
        // New structured format
        setCompatibility(initialData.compatibility);
      } else if (initialData.selectedCompatibility && Array.isArray(initialData.selectedCompatibility)) {
        // Convert from selectedCompatibility format to new format
        const convertedCompatibility = initialData.selectedCompatibility.map((item: any) => ({
          make: item.brand,
          model: item.model,
          yearRange: `${item.yearStart}-${item.yearEnd}`
        }));
        setCompatibility(convertedCompatibility);
      } else if (initialData.description && initialData.description.includes('WORKS ON THE FOLLOWING MODELS:')) {
        // Parse description to extract compatibility if it's in the expected format
        const description = initialData.description;
        const modelsText = description.replace('WORKS ON THE FOLLOWING MODELS:', '').trim();
        const models = modelsText.split(',').map((model: string) => model.trim());
        
        const parsedCompatibility = models.map((model: string) => {
          // Parse "Make Model YearRange" format
          const parts = model.split(' ');
          if (parts.length >= 3) {
            const yearRange = parts[parts.length - 1];
            const modelName = parts[parts.length - 2];
            const make = parts.slice(0, -2).join(' ');
            return { make, model: modelName, yearRange };
          }
          return null;
        }).filter(Boolean) as Array<{ make: string, model: string, yearRange: string }>;
        
        setCompatibility(parsedCompatibility);
      }
    }
  }, [initialData]);

  // Fetch dynamic data from Firestore
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        // Fetch vehicle types
        const vehicleTypesSnapshot = await getDocs(collection(db, 'vehicleTypes'));
        const vehicleTypesData = vehicleTypesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{id: string, name: string, isActive: boolean}>;

        // Fetch brands
        const brandsSnapshot = await getDocs(collection(db, 'brands'));
        const brandsData = brandsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{id: string, name: string, isActive: boolean}>;

        // Fetch models
        const modelsSnapshot = await getDocs(collection(db, 'models'));
        const modelsData = modelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{id: string, brandId: string, name: string, keyTypes: string[], isActive: boolean}>;

        setDynamicVehicleTypes(vehicleTypesData.filter(vt => vt.isActive));
        setDynamicBrands(brandsData.filter(brand => brand.isActive));
        setDynamicModels(modelsData.filter(model => model.isActive));
        
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched categories:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching dynamic data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDynamicData();
  }, []);

  // Handle initialData when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        title: initialData.title || "",
        partNumber: initialData.partNumber || "",
        manufacturer: initialData.manufacturer || "",
        price: initialData.price || "",
        oldPrice: initialData.oldPrice || "",
        category: initialData.category || "",
        categoryId: initialData.categoryId || "",
        categories: initialData.categories || [],
        vehicleTypes: initialData.vehicleTypes || [],
        stock: initialData.stock?.toString() || "",
        lowStockAmount: initialData.lowStockAmount?.toString() || "",
        status: initialData.status || "active",
        availability: initialData.availability || "in-stock",
        isFeatured: initialData.isFeatured || false,
        visibility: initialData.visibility || "visible",
        shortDescription: initialData.shortDescription || "",
        description: initialData.description || "",
        images: initialData.images || [initialData.imageUrl].filter(Boolean),
        technicalSpecs: {
          fccId: initialData.technicalSpecs?.fccId || "",
          can: initialData.technicalSpecs?.can || "",
          frequency: initialData.technicalSpecs?.frequency || "",
          batteryType: initialData.technicalSpecs?.batteryType || "",
          chipType: initialData.technicalSpecs?.chipType || "",
          testBlade: initialData.technicalSpecs?.testBlade || "",
          buttons: initialData.technicalSpecs?.buttons || [],
          buttonCount: initialData.technicalSpecs?.buttonCount || 1,
          emergencyKeyIncluded: initialData.technicalSpecs?.emergencyKeyIncluded || false,
          aftermarket: initialData.technicalSpecs?.aftermarket || false,
          reusable: initialData.technicalSpecs?.reusable || false,
          cloneable: initialData.technicalSpecs?.cloneable || false
        },
        isOem: initialData.isOem || false,
        isAftermarket: initialData.isAftermarket || false,
        oemPartNumber: initialData.oemPartNumber || "",
        aftermarketPartNumber: initialData.aftermarketPartNumber || "",
        compatibleModels: initialData.compatibleModels || [],
        replacesKeyTypes: initialData.replacesKeyTypes || [],
        warranty: initialData.warranty || "",
        returnPolicy: initialData.returnPolicy || "",
        shippingInfo: initialData.shippingInfo || "",
        installationNotes: initialData.installationNotes || "",
        weight: initialData.weight?.toString() || "",
        dimensions: {
          length: initialData.dimensions?.length?.toString() || "",
          width: initialData.dimensions?.width?.toString() || "",
          height: initialData.dimensions?.height?.toString() || ""
        },
        allowReviews: initialData.allowReviews ?? true,
        purchaseNote: initialData.purchaseNote || "",
        salePrice: initialData.salePrice || "",
        regularPrice: initialData.regularPrice || "",
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(", ") : initialData.tags || "",
        shippingClass: initialData.shippingClass || "",
        vehicleType: initialData.vehicleType || "Car",
        brand: initialData.brand || "",
        year: initialData.year?.toString() || "",
        keyType: initialData.keyType || "Remote Key",
        selectedCompatibility: initialData.selectedCompatibility || []
      });
    }
  }, [initialData, isEditing]);

  // Get available models for a brand
  const getAvailableModels = useCallback((brand: string) => {
    const brandData = dynamicBrands.find(b => b.name === brand);
    
    if (!brandData) {
      console.log('Brand not found in dynamic data:', brand);
      return {};
    }
    
    // Get models from dynamic data for this brand
    const brandModels = dynamicModels.filter(model => model.brandId === brandData.id);
    const modelsObject: any = {};
    
    brandModels.forEach(model => {
      // Ensure model data has required fields with fallbacks
      modelsObject[model.name] = {
        keyTypes: ['Remote Key', 'Smart Key'] // Default key types for all models
      };
    });
    
    console.log(`Found ${brandModels.length} models for brand ${brand}:`, Object.keys(modelsObject));
    return modelsObject;
  }, [dynamicBrands, dynamicModels]);

  // Get available brands for selected vehicle type
  const availableBrands = useMemo(() => {
    if (!selectedVehicleType) return [];
    
    // Find the vehicle type ID
    const vehicleType = dynamicVehicleTypes.find(vt => vt.name === selectedVehicleType);
    if (!vehicleType) {
      console.log('Vehicle type not found in dynamic data:', selectedVehicleType);
      return [];
    }
    
    // Filter brands by vehicle type ID
    const filteredBrands = dynamicBrands.filter(brand => brand.vehicleTypeId === vehicleType.id);
    
    console.log(`Found ${filteredBrands.length} brands for vehicle type ${selectedVehicleType}:`, filteredBrands.map(b => b.name));
    return filteredBrands.map(brand => brand.name).sort();
  }, [selectedVehicleType, dynamicVehicleTypes, dynamicBrands]);

  // Memoized models for each brand to prevent re-renders
  const availableModelsMap = useMemo(() => {
    const modelsMap: { [key: string]: any } = {};
    availableBrands.forEach((brand: string) => {
      modelsMap[brand] = getAvailableModels(brand);
    });
    return modelsMap;
  }, [availableBrands, getAvailableModels]);

  // Get available key types for a brand and model
  const getAvailableKeyTypes = (brand: string, model: string) => {
    const models = getAvailableModels(brand);
    return models[model]?.keyTypes || [];
  };

  // Get available years
  const getAvailableYears = () => {
    return years;
  };

  // Vehicle compatibility master data (from API)
  const [compatData, setCompatData] = useState<any>({});
  const [compatLoading, setCompatLoading] = useState(true);
  const [compatError, setCompatError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  // Dropdown state (like navbar filter)
  const [compatSelectedMake, setCompatSelectedMake] = useState('');
  const [compatSelectedModel, setCompatSelectedModel] = useState('');
  const [compatSelectedYear, setCompatSelectedYear] = useState('');
  // Structured compatibility array
  const [compatibility, setCompatibility] = useState<Array<{ make: string, model: string, yearRange: string }>>([]);

  // Fetch vehicle compatibility master data from API
  useEffect(() => {
    const fetchCompatData = async () => {
      setCompatLoading(true);
      setCompatError(null);
      try {
        const res = await fetch('/api/vehicle-compatibility/makes-models');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCompatData(data);
      } catch (e) {
        setCompatError('Failed to load vehicle compatibility data');
      }
      setCompatLoading(false);
    };
    fetchCompatData();
  }, []);

  // Add current selection to compatibility list
  const addToCompatibility = () => {
    if (compatSelectedMake) {
      const newCompat = {
        make: compatSelectedMake,
        model: compatSelectedModel || '',
        yearRange: compatSelectedYear || ''
      };
      
      // Check if this combination already exists
      const exists = compatibility.some(item => 
        item.make === newCompat.make && 
        item.model === newCompat.model && 
        item.yearRange === newCompat.yearRange
      );
      
      if (!exists) {
        setCompatibility([...compatibility, newCompat]);
        
        // Reset selections
        setCompatSelectedMake('');
        setCompatSelectedModel('');
        setCompatSelectedYear('');
      }
    }
  };

  // Remove from compatibility list
  const removeFromCompatibility = (index: number) => {
    setCompatibility(compatibility.filter((_, i) => i !== index));
  };

  // Generate description text from compatibility array and technical specs
  const generateCompatibilityDescription = useCallback((compatList: Array<{ make: string, model: string, yearRange: string }>) => {
    let description = '';
    
    // Vehicle compatibility section
    if (compatList.length > 0) {
      const models = compatList.map(item => {
        let modelText = item.make;
        if (item.model) {
          modelText += ` ${item.model}`;
        } else {
          modelText += ' (All Models)';
        }
        if (item.yearRange) {
          modelText += ` ${item.yearRange}`;
        } else {
          modelText += ' (All Years)';
        }
        return modelText;
      });
      description += `WORKS ON THE FOLLOWING MODELS: ${models.join(', ')}\n\n`;
    }
    
    // Technical specifications section (without title)
    
    // Buttons
    if (formData.technicalSpecs?.buttons && formData.technicalSpecs.buttons.length > 0) {
      description += `BUTTONS: ${formData.technicalSpecs.buttons.join(', ')}\n`;
    }
    
    // OEM Part Number
    if (formData.oemPartNumber) {
      description += `OEM PART #(S): ${formData.oemPartNumber}\n`;
    }
    
    // FCC ID
    if (formData.technicalSpecs?.fccId) {
      description += `COMPATIBLE FCC ID: ${formData.technicalSpecs.fccId}\n`;
    }
    
    // CAN
    if (formData.technicalSpecs?.can) {
      description += `COMPATIBLE CAN: ${formData.technicalSpecs.can}\n`;
    }
    
    // Frequency
    if (formData.technicalSpecs?.frequency) {
      description += `FREQUENCY: ${formData.technicalSpecs.frequency}\n`;
    }
    
    // Battery Type
    if (formData.technicalSpecs?.batteryType) {
      description += `BATTERY TYPE: ${formData.technicalSpecs.batteryType}\n`;
    }
    
    // Chip Type
    if (formData.technicalSpecs?.chipType) {
      description += `CHIP TYPE: ${formData.technicalSpecs.chipType}\n`;
    }
    
    // Emergency Key
    if (formData.technicalSpecs?.emergencyKeyIncluded) {
      description += `EMERGENCY KEY: Included\n`;
    }
    
    // Test Blade
    if (formData.technicalSpecs?.testBlade) {
      description += `TEST BLADE: ${formData.technicalSpecs.testBlade}\n`;
    }
    
    // Reusable
    if (formData.technicalSpecs?.reusable) {
      description += `REUSABLE: Yes\n`;
    }
    
    // Cloneable - separate field
    if (formData.technicalSpecs?.cloneable) {
      description += `CLONEABLE: Yes\n`;
    }
    
    // Condition - only show if explicitly set
    if (formData.isOem || formData.technicalSpecs?.aftermarket) {
      let conditionText = '';
      if (formData.isOem) {
        conditionText = 'New OEM';
      } else if (formData.technicalSpecs?.aftermarket) {
        conditionText = 'New Aftermarket SHELL';
      }
      
      description += `CONDITION: ${conditionText}`;
    }
    
    return description.trim();
  }, [formData.technicalSpecs, formData.oemPartNumber, formData.isOem]);

  // Auto-regenerate description when technical specs or compatibility changes
  useEffect(() => {
    const description = generateCompatibilityDescription(compatibility);
    setFormData(prev => ({
      ...prev,
      description: description
    }));
  }, [compatibility, formData.technicalSpecs, formData.oemPartNumber, formData.isOem, generateCompatibilityDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    console.log('Form submission - Images count:', formData.images.length);
    console.log('Form submission - Images types:', formData.images.map(img => img.substring(0, 30) + '...'));
    
    // Convert compatibility to selectedCompatibility format for backward compatibility
    const selectedCompatibility = compatibility.map(item => ({
      brand: item.make,
      model: item.model,
      yearStart: item.yearRange ? item.yearRange.split('-')[0] : '',
      yearEnd: item.yearRange ? (item.yearRange.split('-')[1] || item.yearRange.split('-')[0]) : '',
      keyTypes: ['Remote Key', 'Smart Key'] // Default key types
    }));
    
    // Attach compatibility as structured array
    onSubmit({
      ...formData,
      description: formData.description,
      compatibility,
      selectedCompatibility
    });
  };

  const handleButtonToggle = (button: string, checked: boolean) => {
    setFormData(prev => {
      const currentButtons = prev.technicalSpecs.buttons || [];
      let newButtons;
      
      if (checked) {
        // Add button if not already present
        newButtons = currentButtons.includes(button) ? currentButtons : [...currentButtons, button];
      } else {
        // Remove button if present
        newButtons = currentButtons.filter(b => b !== button);
      }
      
      return {
        ...prev,
        technicalSpecs: {
          ...prev.technicalSpecs,
          buttons: newButtons
        }
      };
    });
  };



  // Dynamic vehicle types from database
  const vehicleTypes = dynamicVehicleTypes.map(vt => vt.name).sort();

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Basic Product Information */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
              <input
                type="text"
                value={formData.partNumber}
                onChange={(e) => setFormData({...formData, partNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product part number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category * ({categories.length} available)
              </label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value, category: categories.find(cat => cat.id === e.target.value)?.name || ''})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <div className="text-xs text-gray-500 mt-1">No categories found. Please create categories first.</div>
              )}
            </div>
          </div>
        </div>

                {/* Product Images */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images *</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Display uploaded images */}
              {formData.images?.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`Product ${index + 1}`} 
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingImageIndex(index);
                        setEditingImageSrc(image);
                      }}
                      className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600 z-10"
                      title="Edit Image"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentImages = formData.images || [];
                        const newImages = currentImages.filter((_, i) => i !== index);
                        setFormData({...formData, images: newImages});
                      }}
                      className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                      title="Delete Image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Upload slot */}
              {(!formData.images || formData.images.length < 4) && (
                <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const currentImages = formData.images || [];
                          const newImages = [...currentImages, e.target?.result as string];
                          setFormData({...formData, images: newImages});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <div className="text-gray-400 text-2xl mb-1">+</div>
                    <div className="text-gray-400 text-xs">Add Image</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              Upload 1-4 clear images of the key (JPG, PNG, GIF). At least one image is required.
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter price (e.g., $189.99)"
                required
              />
            </div>
          </div>
        </div>

        {/* Vehicle Compatibility */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Compatibility</h3>
          {/* Vehicle Compatibility Dropdowns (like navbar filter) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Vehicle Compatibility *</label>
            
            <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              <p className="font-medium mb-2">💡 Flexible Compatibility Options:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Vehicle only:</strong> Compatible with all models and years for that vehicle</li>
                <li><strong>Vehicle + Model:</strong> Compatible with all years for that vehicle and model</li>
                <li><strong>Vehicle + Model + Year:</strong> Compatible with specific year range</li>
              </ul>
            </div>

            {compatLoading ? (
              <div className="text-gray-500">Loading vehicle data...</div>
            ) : compatError ? (
              <div className="text-red-600">{compatError}</div>
            ) : (
              <>
                {/* Dropdowns like navbar filter */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                    <select
                      value={compatSelectedMake}
                      onChange={(e) => setCompatSelectedMake(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                    >
                      <option value="">Select Vehicle</option>
                      {Object.keys(compatData).sort().map((make: string) => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Model</label>
                    <select
                      value={compatSelectedModel}
                      onChange={(e) => setCompatSelectedModel(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      disabled={!compatSelectedMake}
                    >
                      <option value="">Select Model</option>
                      {compatSelectedMake && compatData[compatSelectedMake] && Object.keys(compatData[compatSelectedMake]).map((model: string) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Year Range (Optional)</label>
                    <select
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      value={compatSelectedYear}
                      onChange={e => setCompatSelectedYear(e.target.value)}
                      disabled={!compatSelectedModel}
                    >
                      <option value="">All Years</option>
                      {compatSelectedMake && compatSelectedModel && compatData[compatSelectedMake] && compatData[compatSelectedMake][compatSelectedModel] && compatData[compatSelectedMake][compatSelectedModel].map((yearRange: string) => (
                        <option key={yearRange} value={yearRange}>{yearRange}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Add Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={addToCompatibility}
                    disabled={!compatSelectedMake}
                    className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add to Compatibility
                  </button>
                </div>

                {/* Selected Compatibility List */}
                {compatibility.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Compatibility:</h4>
                    <div className="space-y-2">
                      {compatibility.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                          <span className="text-sm">
                            <strong>{item.make}</strong> {item.model ? `- ${item.model}` : '(All Models)'} {item.yearRange ? `(${item.yearRange})` : '(All Years)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCompatibility(idx)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">FCC ID</label>
              <input
                type="text"
                value={formData.technicalSpecs.fccId}
                onChange={(e) => setFormData({
                  ...formData, 
                  technicalSpecs: {...formData.technicalSpecs, fccId: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAN</label>
              <input
                type="text"
                value={formData.technicalSpecs.can}
                onChange={(e) => setFormData({
                  ...formData, 
                  technicalSpecs: {...formData.technicalSpecs, can: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={formData.technicalSpecs.frequency}
                onChange={(e) => setFormData({
                  ...formData, 
                  technicalSpecs: {...formData.technicalSpecs, frequency: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Frequency</option>
                {frequencyOptions.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Battery Type</label>
              <select
                value={formData.technicalSpecs.batteryType}
                onChange={(e) => setFormData({
                  ...formData, 
                  technicalSpecs: {...formData.technicalSpecs, batteryType: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Battery</option>
                {batteryTypes.map(battery => (
                  <option key={battery} value={battery}>{battery}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chip Type</label>
              <input
                type="text"
                value={formData.technicalSpecs.chipType}
                onChange={(e) => setFormData({
                  ...formData, 
                  technicalSpecs: {...formData.technicalSpecs, chipType: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Blade</label>
              <input
                type="text"
                value={formData.technicalSpecs.testBlade}
                onChange={(e) => setFormData({
                  ...formData, 
                  technicalSpecs: {...formData.technicalSpecs, testBlade: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Buttons Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buttons</label>
            <div className="flex flex-wrap gap-2">
              {buttonOptions.map(button => (
                <div key={button} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`button-${button}`}
                    checked={(formData.technicalSpecs.buttons || []).includes(button)}
                    onChange={() => {}} // Dummy onChange to satisfy React
                    onClick={(e) => {
                      // Use onClick instead of onChange since onChange isn't firing
                      const newChecked = !(formData.technicalSpecs.buttons || []).includes(button);
                      handleButtonToggle(button, newChecked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    style={{ zIndex: 1000, position: 'relative' }}
                  />
                  <label htmlFor={`button-${button}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                    {button}
                  </label>
                </div>
              ))}
            </div>
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
              Selected buttons: {formData.technicalSpecs.buttons.length > 0 ? formData.technicalSpecs.buttons.join(', ') : 'None'}
            </div>
          </div>

          {/* Technical Checkboxes */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.technicalSpecs.emergencyKeyIncluded}
                onChange={() => {}} // Dummy onChange to satisfy React
                onClick={() => setFormData({
                  ...formData,
                  technicalSpecs: {...formData.technicalSpecs, emergencyKeyIncluded: !formData.technicalSpecs.emergencyKeyIncluded}
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-700 cursor-pointer">Emergency Key Included</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.technicalSpecs.aftermarket}
                onChange={() => {}} // Dummy onChange to satisfy React
                onClick={() => setFormData({
                  ...formData,
                  technicalSpecs: {...formData.technicalSpecs, aftermarket: !formData.technicalSpecs.aftermarket}
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-700 cursor-pointer">Aftermarket</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.technicalSpecs.reusable}
                onChange={() => {}} // Dummy onChange to satisfy React
                onClick={() => setFormData({
                  ...formData,
                  technicalSpecs: {...formData.technicalSpecs, reusable: !formData.technicalSpecs.reusable}
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-2 text-gray-700 cursor-pointer">Reusable</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.technicalSpecs.cloneable}
                onChange={() => {}} // Dummy onChange to satisfy React
                onClick={() => setFormData({
                  ...formData,
                  technicalSpecs: {...formData.technicalSpecs, cloneable: !formData.technicalSpecs.cloneable}
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-700 cursor-pointer">Cloneable</span>
            </label>
          </div>
        </div>

        {/* Descriptions */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Descriptions</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief product description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Compatibility Description</label>
              <div className="w-full border border-gray-300 rounded-lg bg-white overflow-hidden">
                {formData.description ? (
                  <div className="text-sm">
                    {/* Parse and display description in table format */}
                    {formData.description.split('\n').map((line, index) => {
                      if (line.includes(':')) {
                        const [label, value] = line.split(':').map(part => part.trim());
                        if (label && value) {
                          return (
                            <div key={index} className="flex border-b border-gray-200 last:border-b-0">
                              <div className="w-1/3 bg-gray-100 px-3 py-2 font-medium text-gray-700 border-r border-gray-200">
                                {label}
                              </div>
                              <div className="w-2/3 px-3 py-2 text-gray-900">
                                {value}
                              </div>
                            </div>
                          );
                        }
                      }
                      // Handle lines without colons (like section headers)
                      return (
                        <div key={index} className="px-3 py-2 font-semibold text-gray-800 bg-blue-50 border-b border-gray-200">
                          {line}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-gray-500 text-sm italic text-center">
                    Select vehicle compatibility above to auto-generate description
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This description is automatically generated based on your vehicle compatibility selections
              </p>
            </div>
          </div>
        </div>
                                    
        {/* Form Actions */}
        <div className="flex justify-end gap-4">
                <button
                  type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product')}
                </button>
              </div>
      </form>

      {/* Image Editor Modal */}
      {editingImageIndex !== null && (
        <ImageEditor
          imageSrc={editingImageSrc}
          onSave={(editedImage) => {
            console.log('Image editor saved, updating image at index:', editingImageIndex);
            const currentImages = [...formData.images];
            currentImages[editingImageIndex] = editedImage;
            setFormData({ ...formData, images: currentImages });
            setEditingImageIndex(null);
            setEditingImageSrc('');
            console.log('Updated formData.images:', currentImages.length, 'images');
          }}
          onCancel={() => {
            console.log('Image editor cancelled');
            setEditingImageIndex(null);
            setEditingImageSrc('');
          }}
        />
      )}
    </div>
  );
} 