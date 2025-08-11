'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Dropzone from 'react-dropzone';

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface FlexibleProductFormProps {
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
  uploading?: boolean;
}

// Image Editor Component (same as EnhancedProductForm)
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
    setIsDrawing(true);
    console.log('Started drawing at:', e.clientX, e.clientY);
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
    
    console.log('Attempting to save canvas, size:', canvas.width, 'x', canvas.height);
    
    // Check if the image is from an external source (URL)
    const isExternalImage = imageSrc.startsWith('http') && !imageSrc.startsWith('data:');
    
    if (isExternalImage) {
      console.log('External image detected, using special handling...');
      
      // For external images, we need to handle CORS issues
      try {
        // Create a new canvas to avoid tainted canvas issues
        const newCanvas = document.createElement('canvas');
        const newCtx = newCanvas.getContext('2d');
        if (!newCtx) {
          throw new Error('Could not get 2D context for new canvas');
        }
        
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        
        // Copy the current canvas content to the new canvas
        newCtx.drawImage(canvas, 0, 0);
        
        // Try to save from the new canvas
        newCanvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const editedImage = e.target?.result as string;
              console.log('Successfully saved external image via new canvas, size:', editedImage.length);
              onSave(editedImage);
            };
            reader.readAsDataURL(blob);
          } else {
            console.error('Failed to create blob from new canvas');
            // Try toDataURL as fallback
            try {
              const editedImage = newCanvas.toDataURL('image/jpeg', 0.95);
              console.log('Fallback: saved via toDataURL, size:', editedImage.length);
              onSave(editedImage);
            } catch (fallbackError) {
              console.error('All methods failed for external image:', fallbackError);
              onSave(imageSrc);
            }
          }
        }, 'image/jpeg', 0.95);
        
      } catch (error) {
        console.error('Error handling external image:', error);
        onSave(imageSrc);
      }
    } else {
      // For local/data URLs, use the standard approach
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const editedImage = e.target?.result as string;
              console.log('Successfully saved local image via blob, size:', editedImage.length);
              onSave(editedImage);
            };
            reader.readAsDataURL(blob);
          } else {
            throw new Error('Failed to create blob from canvas');
          }
        }, 'image/jpeg', 0.95);
        
      } catch (error) {
        console.error('Error saving local image:', error);
        
        // Fallback: try toDataURL directly
        try {
          const editedImage = canvas.toDataURL('image/jpeg', 0.95);
          console.log('Fallback: saved via toDataURL, size:', editedImage.length);
          onSave(editedImage);
        } catch (toDataURLError) {
          console.error('toDataURL also failed:', toDataURLError);
          onSave(imageSrc);
        }
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg p-3 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Edit Image</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Tools */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-xs sm:text-sm font-medium">Tool:</label>
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value as 'brush' | 'eraser')}
              className="px-1 sm:px-2 py-1 border rounded text-xs sm:text-sm"
            >
              <option value="brush">Brush</option>
              <option value="eraser">Eraser</option>
            </select>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-xs sm:text-sm font-medium">Size:</label>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16 sm:w-20"
            />
            <span className="text-xs sm:text-sm">{brushSize}px</span>
          </div>

          {tool === 'brush' && (
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium">Color:</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-6 h-6 sm:w-8 sm:h-8 border rounded cursor-pointer"
              />
            </div>
          )}

          <button
            onClick={clearCanvas}
            className="px-2 sm:px-3 py-1 bg-gray-500 text-white rounded text-xs sm:text-sm hover:bg-gray-600"
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
                  // Reload the image by calling the useEffect again
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
                className="max-w-full max-h-96 cursor-crosshair touch-none"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 text-xs sm:text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FlexibleProductForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isEditing = false, 
  uploading = false 
}: FlexibleProductFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    categoryId: "",
    shortDescription: "",
    sku: "",
    partNumber: "",
    manufacturer: "",
    stock: "",
    status: "active",
    images: [] as string[],
    customFields: [] as CustomField[],
    compatibility: [] as any[],
    allowReviews: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingImageSrc, setEditingImageSrc] = useState<string>('');
  
  // Vehicle compatibility master data (from API) - same as EnhancedProductForm
  const [compatData, setCompatData] = useState<any>({});
  const [compatLoading, setCompatLoading] = useState(true);
  const [compatError, setCompatError] = useState<string | null>(null);
  // Dropdown state (like navbar filter and EnhancedProductForm)
  const [compatSelectedMake, setCompatSelectedMake] = useState('');
  const [compatSelectedModel, setCompatSelectedModel] = useState('');
  const [compatSelectedYear, setCompatSelectedYear] = useState('');
  // Structured compatibility array
  const [compatibility, setCompatibility] = useState<Array<{ make: string, model: string, yearRange: string }>>([]);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        price: initialData.price || "",
        category: initialData.category || "",
        categoryId: initialData.categoryId || "",
        shortDescription: initialData.shortDescription || "",
        sku: initialData.sku || "",
        partNumber: initialData.partNumber || "",
        manufacturer: initialData.manufacturer || "",
        stock: initialData.stock?.toString() || "",
        status: initialData.status || "active",
        images: initialData.images || [],
        customFields: initialData.customFields || [],
        compatibility: initialData.compatibility || [],
        allowReviews: initialData.allowReviews ?? true,
        createdAt: initialData.createdAt || new Date(),
        updatedAt: new Date()
      });
      
      // Set compatibility from initialData
      if (initialData.compatibility) {
        setCompatibility(initialData.compatibility);
      }
    }
  }, [initialData]);

  // Set up main category and subcategories when categories are loaded and we have initial data
  useEffect(() => {
    if (categories.length > 0 && initialData?.categoryId) {
      // Find the selected category
      const selectedCategory = categories.find(cat => cat.id === initialData.categoryId);
      
      if (selectedCategory) {
        if (selectedCategory.parentId) {
          // This is a subcategory, set up the main category
          setSelectedMainCategory(selectedCategory.parentId);
          const mainCategorySubcategories = categories.filter(cat => cat.parentId === selectedCategory.parentId);
          setSubcategories(mainCategorySubcategories);
        } else {
          // This is a main category
          setSelectedMainCategory(selectedCategory.id);
          const mainCategorySubcategories = categories.filter(cat => cat.parentId === selectedCategory.id);
          setSubcategories(mainCategorySubcategories);
        }
      }
    }
  }, [categories, initialData]);

  // Debug: monitor formData changes
  useEffect(() => {
    console.log('FormData changed:', formData);
  }, [formData]);

  // Fetch categories and vehicle data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
        const snapshot = await getDocs(categoriesQuery);
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);

        // Fetch vehicle compatibility data
        const response = await fetch('/api/vehicle-compatibility/makes-models');
        if (response.ok) {
          const data = await response.json();
          setCompatData(data);
          setCompatLoading(false);
        } else {
          setCompatError('Failed to fetch vehicle compatibility data');
          setCompatLoading(false);
        }
      } catch (error) {
        setCompatError('Error fetching vehicle compatibility data');
        setCompatLoading(false);
        console.error('Error fetching vehicle compatibility data:', error);
      }
    };

    fetchData();
  }, []);

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      label: "",
      value: ""
    };
    setFormData(prev => ({
      ...prev,
      customFields: [...prev.customFields, newField]
    }));
  };

  const updateCustomField = (id: string, field: 'label' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(f => 
        f.id === id ? { ...f, [field]: value } : f
      )
    }));
  };

  const removeCustomField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== id)
    }));
  };

  const handleMainCategoryChange = (categoryId: string) => {
    console.log('Main category changed to:', categoryId);
    setSelectedMainCategory(categoryId);
    
    // Find subcategories for the selected main category
    const mainCategorySubcategories = categories.filter(cat => cat.parentId === categoryId);
    setSubcategories(mainCategorySubcategories);
    console.log('Found subcategories:', mainCategorySubcategories);
    
    // Clear the selected category if it's not a subcategory of the new main category
    if (formData.categoryId && !mainCategorySubcategories.find(sub => sub.id === formData.categoryId)) {
      setFormData(prev => ({
        ...prev,
        categoryId: '',
        category: ''
      }));
    }
    
    // If no subcategories exist for this main category, set it as the category directly
    if (mainCategorySubcategories.length === 0) {
      const selectedCategory = categories.find(cat => cat.id === categoryId);
      console.log('No subcategories, setting main category as category:', selectedCategory);
      setFormData(prev => ({
        ...prev,
        categoryId: categoryId,
        category: selectedCategory?.name || ''
      }));
    }
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    console.log('Subcategory changed to:', subcategoryId);
    const selectedSubcategory = subcategories.find(sub => sub.id === subcategoryId);
    console.log('Selected subcategory:', selectedSubcategory);
    setFormData(prev => ({
      ...prev,
      categoryId: subcategoryId,
      category: selectedSubcategory?.name || ''
    }));
  };

  // Auto-detect vehicle compatibility from custom fields
  const detectVehicleCompatibility = () => {
    const detectedVehicles: Array<{ make: string, model: string, yearRange: string }> = [];
    const detectionLog: string[] = [];
    
    // Helper function to check if year ranges overlap
    const yearRangesOverlap = (range1: string, range2: string): boolean => {
      const [start1, end1] = range1.split('-').map(y => parseInt(y.trim()));
      const [start2, end2] = range2.split('-').map(y => parseInt(y.trim()));
      
      // Handle single year ranges
      const endYear1 = end1 || start1;
      const endYear2 = end2 || start2;
      
      // Two ranges overlap if they share any common years
      // Range A: start1 to endYear1
      // Range B: start2 to endYear2
      // They overlap if: start1 <= endYear2 AND endYear1 >= start2
      const overlaps = start1 <= endYear2 && endYear1 >= start2;
      
      // Debug logging for BMW Z4
      if (range1.includes('2003-2008') || range2.includes('2003-2008')) {
        console.log(`Overlap check: "${range1}" vs "${range2}"`);
        console.log(`  Range1: ${start1} to ${endYear1}`);
        console.log(`  Range2: ${start2} to ${endYear2}`);
        console.log(`  start1 <= end2: ${start1} <= ${endYear2} = ${start1 <= endYear2}`);
        console.log(`  end1 >= start2: ${endYear1} >= ${start2} = ${endYear1 >= start2}`);
        console.log(`  Result: ${overlaps}`);
      }
      
      return overlaps;
    };

    // Helper function to find ALL overlapping year ranges from the database
    const findAllOverlappingRanges = (targetRange: string, availableRanges: string[]): string[] => {
      const overlappingRanges: string[] = [];
      
      // Debug logging for BMW Z4
      if (targetRange.includes('2003-2008')) {
        console.log(`=== Overlap Detection for "${targetRange}" ===`);
        console.log(`Available ranges: ${availableRanges.join(', ')}`);
      }
      
      // Only add ranges that actually exist in the database
      availableRanges.forEach(range => {
        const overlaps = yearRangesOverlap(targetRange, range);
        
        // Debug logging for BMW Z4
        if (targetRange.includes('2003-2008')) {
          console.log(`Checking "${targetRange}" vs "${range}": ${overlaps}`);
        }
        
        if (overlaps) {
          overlappingRanges.push(range);
        }
      });
      
      // Debug logging for BMW Z4
      if (targetRange.includes('2003-2008')) {
        console.log(`Final overlapping ranges: ${overlappingRanges.join(', ')}`);
      }
      
      return overlappingRanges;
    };

    // Helper function to extract vehicle patterns from text
    const extractVehiclePatterns = (text: string): Array<{make: string, model: string, yearRange: string}> => {
      const patterns: Array<{make: string, model: string, yearRange: string}> = [];
      
      // Split text by lines or common separators to handle multiple vehicles
      const lines = text.split(/[\n\r*]+/).map(line => line.trim()).filter(line => line.length > 0);
      
      lines.forEach(line => {
        // Clean the line for processing
        const cleanLine = line.replace(/[*\s]+/g, ' ').trim();
        detectionLog.push(`Processing line: "${line}"`);
        
        // Look for patterns like "BMW 3-Series 2000-2007" or "BMW X5 2019-2023"
        Object.keys(compatData).forEach(make => {
          const makeLower = make.toLowerCase();
          if (cleanLine.toLowerCase().includes(makeLower)) {
            Object.keys(compatData[make]).forEach(model => {
              const modelLower = model.toLowerCase();
              if (cleanLine.toLowerCase().includes(modelLower)) {
                // Extract year patterns near this make/model combination
                const yearPattern = /(\d{4})(?:-(\d{4}))?/g;
                let match;
                
                while ((match = yearPattern.exec(cleanLine)) !== null) {
                  const yearStart = match[1];
                  const yearEnd = match[2] || yearStart;
                  const yearRange = `${yearStart}-${yearEnd}`;
                  
                  // Debug logging for BMW Z4
                  if (cleanLine.toLowerCase().includes('z4')) {
                    console.log(`Found year pattern: "${yearRange}" in line: "${cleanLine}"`);
                  }
                  
                  // Check if this year range is available for this make/model
                  const availableRanges = compatData[make][model];
                  const overlappingRanges = findAllOverlappingRanges(yearRange, availableRanges);
                  
                  if (overlappingRanges.length > 0) {
                    detectionLog.push(`📅 Found ${overlappingRanges.length} overlapping range(s) for "${yearRange}": ${overlappingRanges.join(', ')}`);
                    
                    // Debug logging for BMW Z4
                    if (cleanLine.toLowerCase().includes('z4')) {
                      console.log(`Available ranges for ${make} ${model}: ${availableRanges.join(', ')}`);
                      console.log(`Overlapping ranges for "${yearRange}": ${overlappingRanges.join(', ')}`);
                    }
                    
                    // Add each overlapping range as a separate entry (only database ranges)
                    overlappingRanges.forEach(range => {
                      // Check if this exact combination already exists in patterns
                      const existingInPatterns = patterns.find(p => 
                        p.make === make && p.model === model && p.yearRange === range
                      );
                      
                      if (!existingInPatterns) {
                        patterns.push({
                          make,
                          model,
                          yearRange: range // Only add the database range, not the original text
                        });
                      }
                    });
                  } else {
                    detectionLog.push(`❌ No overlapping ranges found for "${yearRange}" in available ranges: ${availableRanges.join(', ')}`);
                  }
                }
              }
            });
          }
        });
      });
      
      return patterns;
    };
    
    // Scan all custom fields for vehicle information
    formData.customFields.forEach(field => {
      if (field.label && field.value) {
        const text = field.value; // Use just the value, not the label
        detectionLog.push(`Scanning field: "${field.label}" with value: "${text}"`);
        
        // Extract vehicle patterns from this field
        const patterns = extractVehiclePatterns(text);
        
        patterns.forEach(pattern => {
          const existing = detectedVehicles.find(v => 
            v.make === pattern.make && v.model === pattern.model && v.yearRange === pattern.yearRange
          );
          
          if (!existing) {
            detectedVehicles.push(pattern);
            detectionLog.push(`✅ Detected: ${pattern.make} ${pattern.model} (${pattern.yearRange})`);
          }
        });
        
        if (patterns.length === 0) {
          detectionLog.push(`❌ No vehicle patterns found in: "${text}"`);
        }
      }
    });

    // Add detected vehicles to compatibility list
    if (detectedVehicles.length > 0) {
      const newCompatibility = [...compatibility];
      detectedVehicles.forEach(vehicle => {
        const exists = newCompatibility.some(v => 
          v.make === vehicle.make && v.model === vehicle.model && v.yearRange === vehicle.yearRange
        );
        if (!exists) {
          newCompatibility.push(vehicle);
        }
      });
      setCompatibility(newCompatibility);
      
      // Show detailed success message
      const message = `Detected ${detectedVehicles.length} vehicle range(s):\n\n` +
        detectedVehicles.map(v => `• ${v.make} ${v.model} (${v.yearRange})`).join('\n') +
        '\n\nAdded to Vehicle Compatibility section!\n\nThese are the actual database ranges that will be used for filtering. Your original text will be shown in the product description.';
      alert(message);
    } else {
      // Show detection log for debugging
      const debugMessage = 'No vehicle compatibility patterns found.\n\nDetection log:\n' + 
        detectionLog.join('\n') + 
        '\n\nMake sure to include make, model, and year information in your custom fields.';
      alert(debugMessage);
    }
  };

  // Vehicle compatibility functions
  const addVehicleCompatibility = () => {
    if (compatSelectedMake) {
      const newCompatibility = {
        make: compatSelectedMake,
        model: compatSelectedModel || '',
        yearRange: compatSelectedYear || ''
      };
      
      // Check if this combination already exists
      const exists = compatibility.some(item => 
        item.make === newCompatibility.make && 
        item.model === newCompatibility.model && 
        item.yearRange === newCompatibility.yearRange
      );
      
      if (!exists) {
        setCompatibility(prev => [...prev, newCompatibility]);
        setCompatSelectedMake('');
        setCompatSelectedModel('');
        setCompatSelectedYear('');
      }
    }
  };

  const removeVehicleCompatibility = (index: number) => {
    setCompatibility(prev => prev.filter((_, i) => i !== index));
  };

  const generateDescription = () => {
    const lines: string[] = [];
    
    // Add custom fields to description
    formData.customFields.forEach(field => {
      if (field.label && field.value) {
        // Format all fields with each item on a separate line
        lines.push(`${field.label}:`);
        // Split the value by common separators and format each item on a new line
        const items = field.value.split(/[\n\r*]+/).map(item => item.trim()).filter(item => item.length > 0);
        items.forEach(item => {
          lines.push(`  ${item}`);
        });
      }
    });

    // If no custom fields provided, auto-add vehicle compatibility information
    if (lines.length === 0 && compatibility && compatibility.length > 0) {
      lines.push('Vehicle Compatibility:');
      compatibility.forEach((comp: any) => {
        if (comp.make) {
          let compText = `  ${comp.make}`;
          if (comp.model) {
            compText += ` ${comp.model}`;
          } else {
            compText += ' (All Models)';
          }
          if (comp.yearRange) {
            compText += ` ${comp.yearRange}`;
          } else {
            compText += ' (All Years)';
          }
          lines.push(compText);
        }
      });
    }

    // Note: Vehicle compatibility will be shown from custom fields above
    // The structured compatibility data is only used for filtering

    return lines.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    // Validate category selection
    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }

    // Generate selectedCompatibility from compatibility
    const selectedCompatibility = (compatibility || []).map((comp: any) => {
      let yearStart = '';
      let yearEnd = '';
      if (comp.yearRange && comp.yearRange.includes('-')) {
        [yearStart, yearEnd] = comp.yearRange.split('-').map((s: string) => s.trim());
      } else {
        yearStart = comp.yearRange || '';
        yearEnd = comp.yearRange || '';
      }
      return {
        brand: comp.make,
        model: comp.model,
        yearStart,
        yearEnd,
        keyTypes: []
      };
    });

    // Generate description from custom fields
    const description = generateDescription();

    // Debug: log the form data being submitted
    console.log('Submitting form data:', {
      ...formData,
      description,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      price: parseFloat(formData.price),
      compatibility: compatibility,
      selectedCompatibility,
    });
    
    // Debug: log price details
    console.log('Price debugging:', {
      originalPrice: formData.price,
      originalPriceType: typeof formData.price,
      parsedPrice: parseFloat(formData.price),
      parsedPriceType: typeof parseFloat(formData.price)
    });

    onSubmit({
      ...formData,
      description,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      price: parseFloat(formData.price),
      compatibility: compatibility, // Pass the raw compatibility array with original text
      selectedCompatibility, // Pass the mapped selectedCompatibility array for filtering
    });
  };

  const parseSpecificationTable = () => {
    const pasteArea = document.getElementById('specTablePaste') as HTMLTextAreaElement;
    if (!pasteArea) return;

    const text = pasteArea.value;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsedFields: CustomField[] = [];
    let currentField: CustomField | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is a field label (ends with colon)
      if (line.includes(':') && !line.startsWith('  ') && !line.startsWith('\t')) {
        // If a field is already open, close it and add it to parsedFields
        if (currentField) {
          // Clean up the value (remove extra newlines)
          currentField.value = currentField.value.trim();
          parsedFields.push(currentField);
        }
        
        // Extract field label and value
        const colonIndex = line.indexOf(':');
        const label = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        // Start a new field
        currentField = {
          id: Date.now().toString() + i,
          label: label,
          value: value
        };
      } else if (currentField && line.length > 0) {
        // This is a continuation of the current field's value
        if (currentField.value.length > 0) {
          currentField.value += '\n' + line;
        } else {
          currentField.value = line;
        }
      }
    }

    // Add the last field if it exists
    if (currentField) {
      currentField.value = currentField.value.trim();
      parsedFields.push(currentField);
    }

    // Update formData with parsed fields
    setFormData(prev => ({
      ...prev,
      customFields: parsedFields
    }));

    // Clear the paste area
    pasteArea.value = '';

    alert(`Parsed ${parsedFields.length} custom fields from the table.`);
  };



  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-6">
        {isEditing ? 'Edit Product' : 'Add New Product (Flexible)'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Product Information */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Product Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Part Number</label>
              <input
                type="text"
                value={formData.partNumber}
                onChange={(e) => setFormData({...formData, partNumber: e.target.value})}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                placeholder="Enter product part number"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Main Category * ({categories.filter(cat => !cat.parentId).length} available)
              </label>
              <select
                value={selectedMainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                required
              >
                <option value="">Select a main category</option>
                {categories.filter(cat => !cat.parentId).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategory Selection */}
          {selectedMainCategory && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-xs sm:text-sm font-medium text-blue-800">Subcategory Selection</span>
              </div>
              
              {subcategories.length > 0 ? (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Subcategory * ({subcategories.length} available)
                  </label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                    required
                  >
                    <option value="">Select a subcategory</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Selected
                  </label>
                  <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {categories.find(cat => cat.id === selectedMainCategory)?.name}
                  </div>
                  {/* Hidden input to ensure category data is set */}
                  <input 
                    type="hidden" 
                    value={selectedMainCategory} 
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Images */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Product Images *</h3>
          <div className="space-y-3 sm:space-y-4">
            
            {/* Drag & Drop Zone */}
            <Dropzone
              onDrop={(acceptedFiles, rejectedFiles) => {
                // Handle dropped files
                acceptedFiles.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const currentImages = formData.images || [];
                    const newImages = [...currentImages, e.target?.result as string];
                    setFormData({...formData, images: newImages});
                  };
                  reader.readAsDataURL(file);
                });

                // Handle dropped URLs or data from websites
                rejectedFiles.forEach(file => {
                  console.log('Dropped content:', file);
                  // Try to extract URL from rejected file
                  if (file.file && file.file.type === 'text/uri-list') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const url = e.target?.result as string;
                      if (url && url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                        const currentImages = formData.images || [];
                        const newImages = [...currentImages, url];
                        setFormData({...formData, images: newImages});
                      }
                    };
                    reader.readAsText(file.file);
                  }
                });
              }}
              onDropAccepted={(files) => {
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const currentImages = formData.images || [];
                    const newImages = [...currentImages, e.target?.result as string];
                    setFormData({...formData, images: newImages});
                  };
                  reader.readAsDataURL(file);
                });
              }}
              accept={{
                'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
              }}
              maxFiles={4 - (formData.images?.length || 0)}
              disabled={formData.images?.length >= 4}
              noClick={false}
              noDragEventsBubbling={false}
            >
              {({getRootProps, getInputProps, isDragActive, isDragReject}) => (
                <div
                  {...getRootProps()}
                  className={`w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : isDragReject 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Handle dropped items
                    const items = e.dataTransfer.items;
                    if (items) {
                      for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        
                        // Handle files
                        if (item.kind === 'file') {
                          const file = item.getAsFile();
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const currentImages = formData.images || [];
                              const newImages = [...currentImages, e.target?.result as string];
                              setFormData({...formData, images: newImages});
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                        
                        // Handle URLs
                        if (item.kind === 'string' && item.type === 'text/uri-list') {
                          item.getAsString((url) => {
                            if (url && url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                              const currentImages = formData.images || [];
                              const newImages = [...currentImages, url];
                              setFormData({...formData, images: newImages});
                            }
                          });
                        }
                      }
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  <div className="text-center">
                    {isDragActive ? (
                      <div className="text-blue-600">
                        <div className="text-2xl mb-2">📁</div>
                        <div className="font-medium">Drop images here!</div>
                      </div>
                    ) : isDragReject ? (
                      <div className="text-red-600">
                        <div className="text-2xl mb-2">❌</div>
                        <div className="font-medium">Invalid file type</div>
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        <div className="text-2xl mb-2">📁</div>
                        <div className="font-medium">
                          {formData.images?.length >= 4 
                            ? 'Maximum images reached' 
                            : 'Drag images here or click to browse'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Dropzone>

            {/* Display uploaded images */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {formData.images?.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`Product ${index + 1}`} 
                    className="w-full h-20 sm:h-24 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.png';
                      console.error('Failed to load image:', image);
                      // Show error indicator
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'absolute inset-0 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center';
                        errorDiv.innerHTML = '<span class="text-red-600 text-xs text-center px-2">Image failed to load</span>';
                        parent.appendChild(errorDiv);
                      }
                    }}
                  />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingImageIndex(index);
                        setEditingImageSrc(image);
                      }}
                      className="bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs hover:bg-blue-600 z-10"
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
                      className="bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                      title="Delete Image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Image count info */}
            <div className="text-sm text-gray-600">
              {formData.images?.length || 0} of 4 images uploaded
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Pricing</h3>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Price *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              placeholder="Enter price (e.g., 189.99)"
              required
            />
          </div>
        </div>

        {/* Custom Fields - Dynamic Description */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Product Details (Custom Fields)</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={detectVehicleCompatibility}
                disabled={formData.customFields.length === 0 || compatLoading}
                className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Scan custom fields for vehicle compatibility and auto-add to Vehicle Compatibility section"
              >
                🚗 Auto-Detect
              </button>
              <button
                type="button"
                onClick={addCustomField}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700"
              >
                + Add Field
              </button>
            </div>
          </div>

          {/* Paste Specification Table Feature */}
          <div className="mb-3 sm:mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">📋 Paste Specification Table</h4>
            <p className="text-xs sm:text-sm text-blue-800 mb-3">
              Copy a complete product specification table and paste it here to automatically create all fields:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                placeholder="Paste your specification table here...&#10;Example:&#10;WORKS ON THE FOLLOWING MODELS:&#10;BMW 3-Series 2000-2007*&#10;BMW 5-Series 2000-2007*&#10;BUTTONS:&#10;Lock&#10;Unlock&#10;Trunk&#10;FREQUENCY: 315 MHz&#10;BATTERY: CR2032"
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm resize-vertical"
                rows={4}
                id="specTablePaste"
              />
              <button
                type="button"
                onClick={parseSpecificationTable}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 whitespace-nowrap"
              >
                Parse & Create
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {formData.customFields.map((field) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                    placeholder="Field name (e.g., Material, Size, Color)"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div className="flex-1">
                  <textarea
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                    placeholder="Enter each item on a separate line&#10;Example:&#10;BMW 3-Series 2000-2007&#10;BMW X3 2004-2010&#10;Or:&#10;Lock&#10;Unlock&#10;Trunk"
                    rows={3}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm resize-vertical"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCustomField(field.id)}
                  className="px-2 py-1.5 sm:py-2 text-red-600 hover:text-red-800 text-sm"
                  title="Remove field"
                >
                  ×
                </button>
              </div>
            ))}
            
            {formData.customFields.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <p className="text-xs sm:text-sm">No custom fields added yet.</p>
                <p className="text-xs sm:text-sm">Click &quot;Add Field&quot; to create custom product details.</p>
                <p className="text-xs sm:text-sm">These will appear in the product description.</p>
              </div>
            )}
          </div>
          
          <div className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Preview:</h4>
            <div className="text-xs sm:text-sm text-blue-800">
              {formData.customFields.length > 0 ? (
                <div className="space-y-1">
                  {formData.customFields.map((field, index) => (
                    <div key={index}>
                      {field.label && field.value ? (
                        <span><strong>{field.label}:</strong> {field.value}</span>
                      ) : (
                        <span className="text-gray-500 italic">Incomplete field</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="italic">No fields to preview</span>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle Compatibility */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vehicle Compatibility (Optional)</h3>
            <button
              type="button"
              onClick={addVehicleCompatibility}
              disabled={!compatSelectedMake}
              className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Vehicle
            </button>
          </div>
          
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded text-xs sm:text-sm text-blue-800">
            <p className="font-medium mb-1">💡 Flexible Compatibility Options:</p>
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
              {/* Vehicle Selection */}
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
                    value={compatSelectedYear}
                    onChange={(e) => setCompatSelectedYear(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                    disabled={!compatSelectedModel}
                  >
                    <option value="">All Years</option>
                    {compatSelectedMake && compatSelectedModel && compatData[compatSelectedMake] && compatData[compatSelectedMake][compatSelectedModel] && compatData[compatSelectedMake][compatSelectedModel].map((yearRange: string) => (
                      <option key={yearRange} value={yearRange}>{yearRange}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Display added vehicles */}
              <div className="space-y-2">
                {compatibility.map((vehicle, index) => (
                  <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-white rounded border">
                    <span className="text-xs sm:text-sm font-medium">
                      {vehicle.make} {vehicle.model ? vehicle.model : '(All Models)'} {vehicle.yearRange ? `(${vehicle.yearRange})` : '(All Years)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVehicleCompatibility(index)}
                      className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {compatibility.length === 0 && (
                  <div className="text-center py-3 sm:py-4 text-gray-500">
                    <p className="text-xs sm:text-sm">No vehicle compatibility added yet.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
                                    
        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 sm:px-6 py-1.5 sm:py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-xs sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 sm:px-6 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
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