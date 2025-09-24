'use client';

import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
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
  nextAvailableSKU?: number;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Add CORS support
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    
    img.onerror = () => {
      // If CORS fails, try without crossOrigin
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        canvas.width = fallbackImg.width;
        canvas.height = fallbackImg.height;
        ctx.drawImage(fallbackImg, 0, 0);
      };
      fallbackImg.src = imageSrc;
    };
    
    img.src = imageSrc;
  }, [imageSrc]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      // Try direct export first
      const editedImage = canvas.toDataURL('image/jpeg', 0.95);
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
            onSave(imageSrc);
          };
          img.onerror = () => {
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
          <div className="border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onMouseMove={draw}
              className="max-w-full max-h-96 cursor-crosshair"
            />
          </div>
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

const FlexibleProductForm = memo(function FlexibleProductForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isEditing = false, 
  uploading = false,
  nextAvailableSKU
}: FlexibleProductFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    categoryId: "",
    shortDescription: "",
    sku: nextAvailableSKU ? nextAvailableSKU.toString() : "",
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
  const [addWatermark, setAddWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('OEM');
  const [watermarkPosition, setWatermarkPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-left');
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
  
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
  
  // Vehicle detection state
  const [vehicleDetectionText, setVehicleDetectionText] = useState('');
  
  // SKU validation state
  const [skuError, setSkuError] = useState<string>('');
  




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


  // Fetch categories and vehicle data - memoized for performance
  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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



  // Validate SKU uniqueness
  const validateSKU = async (sku: string) => {
    if (!sku || !sku.trim()) {
      setSkuError('SKU is required');
      return false;
    }
    
    if (isEditing && sku === initialData?.sku) {
      setSkuError(''); // Same SKU for editing is fine
      return true;
    }
    
    try {
      const response = await fetch(`/api/check-sku?sku=${encodeURIComponent(sku)}`);
      if (response.ok) {
        const { isAvailable } = await response.json();
        if (!isAvailable) {
          setSkuError('SKU already exists. Please choose a different one.');
          return false;
        } else {
          setSkuError('');
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking SKU:', error);
      setSkuError('Error checking SKU availability');
      return false;
    }
    
    setSkuError('');
    return true;
  };

  // Generate next available SKU
  const generateNextSKU = async () => {
    try {
      const response = await fetch('/api/next-available-sku');
      if (response.ok) {
        const { nextSKU } = await response.json();
        setFormData(prev => ({ ...prev, sku: nextSKU.toString() }));
        setSkuError('');
      }
    } catch (error) {
      console.error('Error generating next SKU:', error);
      setSkuError('Error generating next SKU');
    }
  };

  const handleMainCategoryChange = (categoryId: string) => {
    setSelectedMainCategory(categoryId);
    
    // If no category is selected, clear all category data
    if (!categoryId) {
      setSubcategories([]);
      setFormData(prev => ({
        ...prev,
        categoryId: '',
        category: ''
      }));
      return;
    }
    
    // Find subcategories for the selected main category
    const mainCategorySubcategories = categories.filter(cat => cat.parentId === categoryId);
    setSubcategories(mainCategorySubcategories);
    
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
      setFormData(prev => ({
        ...prev,
        categoryId: categoryId,
        category: selectedCategory?.name || ''
      }));
    }
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    
    // If no subcategory is selected, clear category data
    if (!subcategoryId) {
      setFormData(prev => ({
        ...prev,
        categoryId: '',
        category: ''
      }));
      return;
    }
    
    const selectedSubcategory = subcategories.find(sub => sub.id === subcategoryId);
    setFormData(prev => ({
      ...prev,
      categoryId: subcategoryId,
      category: selectedSubcategory?.name || ''
    }));
  };

    // Helper function to create custom fields from text
  const createCustomFieldsFromText = (text: string) => {
    const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
    const newFields: Array<{id: string, label: string, value: string}> = [];
    
    // Group items by category first
    const vehicleModels: string[] = [];
    const buttons: string[] = [];
    const oemParts: string[] = [];
    const otherItems: Array<{label: string, value: string}> = [];
    
    // Parse text with proper label-value grouping
    let currentLabel = '';
    let currentValues: string[] = [];
    
    
    lines.forEach((line, index) => {
      // Skip empty lines
      if (!line.trim()) return;
      
      
      // Check if line contains a colon (label: value format)
      if (line.includes(':')) {
        
        // If we have a previous label with values, save it
        if (currentLabel && currentValues.length > 0) {
          const value = currentValues.join('\n');
          
          // Check if this is a special category that should be grouped
          const lowerLabel = currentLabel.toLowerCase();
          
          if (lowerLabel.includes('button') || lowerLabel === 'buttons' || lowerLabel === 'buttong' || lowerLabel.includes('btn')) {
            // Add to buttons array for consolidation
            currentValues.forEach(val => buttons.push(val));
          } else if (lowerLabel.includes('model') || lowerLabel.includes('compatibility') || lowerLabel.includes('works on')) {
            // Add to vehicle models array for consolidation
            currentValues.forEach(val => vehicleModels.push(val));
          } else if (lowerLabel.includes('oem') || lowerLabel.includes('part') || lowerLabel.includes('part #')) {
            // Add to OEM parts array for consolidation
            currentValues.forEach(val => oemParts.push(val));
          } else {
            // Add as individual field
            otherItems.push({
              label: currentLabel,
              value: value
            });
          }
        }
        
        // Start new label
        const [label, ...valueParts] = line.split(':');
        currentLabel = label.trim();
        // If there's a value on the same line, add it; otherwise start with empty array
        const inlineValue = valueParts.join(':').trim();
        currentValues = inlineValue ? [inlineValue] : [];
      } else {
        // This line is a value for the current label
        if (currentLabel) {
          currentValues.push(line.trim());
        } else {
          // No current label, try to detect common patterns
          const lowerLine = line.toLowerCase();
          
          // Vehicle compatibility patterns - detect Lexus, BMW, Ford, etc. models
          if (lowerLine.includes('lexus') || lowerLine.includes('bmw') || lowerLine.includes('ford') || 
              lowerLine.includes('toyota') || lowerLine.includes('honda') || lowerLine.includes('mercedes') ||
              lowerLine.includes('audi') || lowerLine.includes('volkswagen') || lowerLine.includes('nissan') ||
              lowerLine.includes('chevrolet') || lowerLine.includes('dodge') || lowerLine.includes('jeep') ||
              lowerLine.includes('hyundai') || lowerLine.includes('kia') || lowerLine.includes('mazda') ||
              lowerLine.includes('subaru') || lowerLine.includes('volvo') || lowerLine.includes('jaguar') ||
              lowerLine.includes('land rover') || lowerLine.includes('porsche') || lowerLine.includes('ferrari') ||
              lowerLine.includes('lamborghini') || lowerLine.includes('maserati') || lowerLine.includes('alfa romeo')) {
            
            vehicleModels.push(line.trim());
          }
          // Button patterns
          else if (lowerLine.includes('lock') || lowerLine.includes('unlock') || lowerLine.includes('trunk') || lowerLine.includes('panic')) {
            buttons.push(line.trim());
          }
          // OEM Part patterns
          else if (lowerLine.includes('oem') || lowerLine.includes('part') || /^\d{5}-\d{2}[A-Z]\d{2}$/.test(line.trim())) {
            oemParts.push(line.trim());
          }
          // FCC ID patterns
          else if (lowerLine.includes('fcc') || lowerLine.includes('hyq')) {
            otherItems.push({
              label: 'FCC ID',
              value: line.trim()
            });
          }
          // Chip patterns
          else if (lowerLine.includes('chip') || lowerLine.includes('texas') || lowerLine.includes('h-8a')) {
            otherItems.push({
              label: 'CHIP',
              value: line.trim()
            });
          }
          // Frequency patterns
          else if (lowerLine.includes('mhz') || lowerLine.includes('frequency')) {
            otherItems.push({
              label: 'FREQUENCY',
              value: line.trim()
            });
          }
          // Battery patterns
          else if (lowerLine.includes('cr') || lowerLine.includes('battery')) {
            otherItems.push({
              label: 'BATTERY',
              value: line.trim()
            });
          }
          // Keyway patterns
          else if (lowerLine.includes('keyway') || lowerLine.includes('lxp')) {
            otherItems.push({
              label: 'KEYWAY',
              value: line.trim()
            });
          }
          // Condition patterns
          else if (lowerLine.includes('condition') || lowerLine.includes('oem') || lowerLine.includes('new')) {
            otherItems.push({
              label: 'CONDITION',
              value: line.trim()
            });
          }
          // Default: create a generic field
          else {
            otherItems.push({
              label: 'Additional Info',
              value: line.trim()
            });
          }
        }
      }
    });
    
    // Don't forget to process the last label-value group
    if (currentLabel && currentValues.length > 0) {
      const value = currentValues.join('\n');
      
      // Check if this is a special category that should be grouped
      const lowerLabel = currentLabel.toLowerCase();
      
      if (lowerLabel.includes('button') || lowerLabel === 'buttons' || lowerLabel === 'buttong') {
        // Add to buttons array for consolidation
        currentValues.forEach(val => buttons.push(val));
      } else if (lowerLabel.includes('model') || lowerLabel.includes('compatibility') || lowerLabel.includes('works on')) {
        // Add to vehicle models array for consolidation
        currentValues.forEach(val => vehicleModels.push(val));
      } else if (lowerLabel.includes('part') || lowerLabel.includes('part #')) {
        // Add to OEM parts array for consolidation
        currentValues.forEach(val => oemParts.push(val));
      } else {
        // Add as individual field
        otherItems.push({
          label: currentLabel,
          value: value
        });
      }
    }
    
    // Helper function to check if a field with similar label already exists and merge values if needed
    const findOrCreateField = (label: string, value: string) => {
      // Find existing field with similar label (case-insensitive)
      const existingField = formData.customFields.find(existingField => 
        existingField.label.toLowerCase() === label.toLowerCase()
      );
      
      if (existingField) {
        // Field exists, merge the new values into the existing field
        const existingValues = existingField.value.split(/[\n\r]+/).map(v => v.trim()).filter(v => v.length > 0);
        const newValues = value.split(/[\n\r]+/).map(v => v.trim()).filter(v => v.length > 0);
        
        // Combine and deduplicate values
        const allValues = [...new Set([...existingValues, ...newValues])];
        const mergedValue = allValues.join('\n');
        
        // Update the existing field with merged values
        setFormData(prev => ({
          ...prev,
          customFields: prev.customFields.map(f => 
            f.id === existingField.id ? { ...f, value: mergedValue } : f
          )
        }));
        
        
        return null; // Don't create a new field
      } else {
        // Field doesn't exist, create new one
        return {
          id: `field_${Date.now()}_${Math.random()}`,
          label: label,
          value: value
        };
      }
    };
    
    
    // Create consolidated fields using the merge logic
    if (vehicleModels.length > 0) {
      const label = 'WORKS ON THE FOLLOWING MODELS';
      const value = vehicleModels.join('\n');
      const newField = findOrCreateField(label, value);
      if (newField) {
        newFields.push(newField);
      }
    }
    
    if (buttons.length > 0) {
      const label = 'BUTTONS';
      const value = buttons.join('\n');
      const newField = findOrCreateField(label, value);
      if (newField) {
        newFields.push(newField);
      }
    }
    
    if (oemParts.length > 0) {
      const label = 'OEM PART #(S)';
      const value = oemParts.join('\n');
      const newField = findOrCreateField(label, value);
      if (newField) {
        newFields.push(newField);
      }
    }
    
    // Add other individual fields using the merge logic
    otherItems.forEach(item => {
      const newField = findOrCreateField(item.label, item.value);
      if (newField) {
        newFields.push(newField);
      }
    });
    
    return newFields;
  };

  // Function to generate watermark preview - memoized for performance
  const generateWatermarkPreview = useCallback(async () => {
    if (formData.images.length === 0 || !watermarkText.trim()) {
      setWatermarkPreview(null);
      return;
    }
    
    try {
      const preview = await addWatermarkToImage(formData.images[0], watermarkText, watermarkPosition);
      setWatermarkPreview(preview);
    } catch (error) {
      console.error('Error generating watermark preview:', error);
    }
  }, [formData.images, watermarkText, watermarkPosition]);

  // Update preview when watermark settings change - optimized with useCallback
  const generateWatermarkPreviewCallback = useCallback(() => {
    if (addWatermark && formData.images.length > 0) {
      generateWatermarkPreview();
    } else {
      setWatermarkPreview(null);
    }
  }, [addWatermark, formData.images.length, watermarkText, watermarkPosition, generateWatermarkPreview]);

  useEffect(() => {
    const timeoutId = setTimeout(generateWatermarkPreviewCallback, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [generateWatermarkPreviewCallback]);

  // Function to add watermark to image - memoized for performance
  const addWatermarkToImage = useCallback((imageSrc: string, watermarkText: string, position: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Set high DPI canvas for crisp rendering
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = img.width * devicePixelRatio;
        canvas.height = img.height * devicePixelRatio;
        canvas.style.width = img.width + 'px';
        canvas.style.height = img.height + 'px';
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Scale context for high DPI
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Set watermark properties
        const fontSize = Math.max(22, img.width * 0.05); // Responsive font size - increased
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate position based on selected position
        let x, y;
        const padding = 35; // Increased padding
        
        switch (position) {
          case 'top-left':
            x = padding + (ctx.measureText(watermarkText).width / 2);
            y = padding + fontSize / 2;
            break;
          case 'top-right':
            x = img.width - padding - (ctx.measureText(watermarkText).width / 2);
            y = padding + fontSize / 2;
            break;
          case 'bottom-left':
            x = padding + (ctx.measureText(watermarkText).width / 2);
            y = img.height - padding - fontSize / 2;
            break;
          case 'bottom-right':
            x = img.width - padding - (ctx.measureText(watermarkText).width / 2);
            y = img.height - padding - fontSize / 2;
            break;
          default:
            x = padding + (ctx.measureText(watermarkText).width / 2);
            y = padding + fontSize / 2;
        }
        
        // Draw premium background with solid color for better quality
        const textWidth = ctx.measureText(watermarkText).width;
        const textHeight = fontSize;
        const rectPadding = 16; // Increased padding for larger text
        const rectX = x - textWidth / 2 - rectPadding;
        const rectY = y - textHeight / 2 - rectPadding;
        const rectWidth = textWidth + rectPadding * 2;
        const rectHeight = textHeight + rectPadding * 2;
        
        // Create gradient background like Buy Now button
        const gradient = ctx.createLinearGradient(rectX, rectY, rectX + rectWidth, rectY + rectHeight);
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.9)'); // Purple-600
        gradient.addColorStop(1, 'rgba(219, 39, 119, 0.9)'); // Pink-600
        
        // Draw gradient background
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 8);
        ctx.fill();
        
        // Draw subtle border for definition
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Reset shadow and draw crisp white text
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(watermarkText, x, y);
        
        // Convert to data URL with high quality
        const watermarkedImage = canvas.toDataURL('image/jpeg', 0.95);
        resolve(watermarkedImage);
      };
      
      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
      
      img.src = imageSrc;
    });
  }, []);

  // Auto-detect vehicle compatibility from a specific custom field - memoized for performance
  const detectVehiclesFromField = useCallback((fieldId: string) => {
    const field = formData.customFields.find(f => f.id === fieldId);
    if (!field || !field.value.trim()) {
      return;
    }
    
    // Use the field's value for vehicle detection
    const textToAnalyze = field.value;
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
      const overlaps = start1 <= endYear2 && endYear1 >= start2;
      return overlaps;
    };

    // Helper function to find ALL overlapping year ranges from the database
    const findAllOverlappingRanges = (targetRange: string, availableRanges: string[]): string[] => {
      const overlappingRanges: string[] = [];
      
      availableRanges.forEach(range => {
        const overlaps = yearRangesOverlap(targetRange, range);
        if (overlaps) {
          overlappingRanges.push(range);
        }
      });
      
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
                  
                  // Check if this year range is available for this make/model
                  const availableRanges = compatData[make][model];
                  const overlappingRanges = findAllOverlappingRanges(yearRange, availableRanges);
                  
                  if (overlappingRanges.length > 0) {
                    detectionLog.push(`📅 Found ${overlappingRanges.length} overlapping range(s) for "${yearRange}": ${overlappingRanges.join(', ')}`);
                    
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
    
    // Extract vehicle patterns from the field's text
    const patterns = extractVehiclePatterns(textToAnalyze);
    
    patterns.forEach(pattern => {
      const existing = detectedVehicles.find(v => 
        v.make === pattern.make && v.model === pattern.model && v.yearRange === pattern.yearRange
      );
      
      if (!existing) {
        detectedVehicles.push(pattern);
        detectionLog.push(`✅ Detected: ${pattern.make} ${pattern.model} (${pattern.yearRange})`);
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
      
      // Automatically create separate custom fields for each piece of information
      // Use the helper function to create custom fields
      const newFields = createCustomFieldsFromText(textToAnalyze);
      
      // Add all new fields to the form
      if (newFields.length > 0) {
        setFormData(prev => ({
          ...prev,
          customFields: [...prev.customFields, ...newFields]
        }));
      }
      
      // Show success message in console
      const message = `Detected ${detectedVehicles.length} vehicle range(s) from "${field.label}":\n\n${detectedVehicles.map(v => `• ${v.make} ${v.model} (${v.yearRange})`).join('\n')}\n\n✅ Added to Vehicle Compatibility section!\n✅ Created ${newFields.length} custom fields for product details!`;
      console.log(message);
    } else {
      // Show detection log for debugging in console
      const debugMessage = `No vehicle compatibility patterns found in "${field.label}".\n\nDetection log:\n${detectionLog.join('\n')}\n\nMake sure to include make, model, and year information in your text.`;
      console.log(debugMessage);
    }
  }, [formData.customFields, compatData, compatibility, createCustomFieldsFromText]);

  // Auto-detect vehicle compatibility from custom fields - memoized for performance
  const detectVehicleCompatibility = useCallback(() => {
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
      
      
      return overlaps;
    };

    // Helper function to find ALL overlapping year ranges from the database
    const findAllOverlappingRanges = (targetRange: string, availableRanges: string[]): string[] => {
      const overlappingRanges: string[] = [];
      
      
      // Only add ranges that actually exist in the database
      availableRanges.forEach(range => {
        const overlaps = yearRangesOverlap(targetRange, range);
        
        
        if (overlaps) {
          overlappingRanges.push(range);
        }
      });
      
      
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
                  }
                  
                  // Check if this year range is available for this make/model
                  const availableRanges = compatData[make][model];
                  const overlappingRanges = findAllOverlappingRanges(yearRange, availableRanges);
                  
                  if (overlappingRanges.length > 0) {
                    detectionLog.push(`📅 Found ${overlappingRanges.length} overlapping range(s) for "${yearRange}": ${overlappingRanges.join(', ')}`);
                    
                    
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
    
    // Use the dedicated vehicle detection text input
    if (!vehicleDetectionText.trim()) {
      return;
    }
    
    detectionLog.push(`Scanning vehicle detection text: "${vehicleDetectionText}"`);
    
    // Extract vehicle patterns from the detection text
    const patterns = extractVehiclePatterns(vehicleDetectionText);
    
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
      detectionLog.push(`❌ No vehicle patterns found in: "${vehicleDetectionText}"`);
    }

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
      
      // Use the helper function to create custom fields
      const newFields = createCustomFieldsFromText(vehicleDetectionText);
      
      // Add all new fields to the form
      if (newFields.length > 0) {
        setFormData(prev => ({
          ...prev,
          customFields: [...prev.customFields, ...newFields]
        }));
      }
      
      // Show detailed success message in console
      const message = `Detected ${detectedVehicles.length} vehicle range(s):\n\n${detectedVehicles.map(v => `• ${v.make} ${v.model} (${v.yearRange})`).join('\n')}\n\n✅ Added to Vehicle Compatibility section!\n✅ Created ${newFields.length} custom fields for product details!\n\nThese are the actual database ranges that will be used for filtering. Your original text will be shown in the product description.`;
      console.log(message);
    } else {
      // Show detection log for debugging in console
      const debugMessage = 'No vehicle compatibility patterns found.\n\nDetection log:\n' + 
        detectionLog.join('\n') + 
        '\n\nMake sure to include make, model, and year information in your text.';
      console.log(debugMessage);
    }
  }, [vehicleDetectionText, compatData, compatibility, createCustomFieldsFromText]);

  // Vehicle compatibility functions - memoized for performance
  const addVehicleCompatibility = useCallback(() => {
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
  }, [compatSelectedMake, compatSelectedModel, compatSelectedYear, compatibility]);

  const removeVehicleCompatibility = useCallback((index: number) => {
    setCompatibility(prev => prev.filter((_, i) => i !== index));
  }, []);

  const generateDescription = useCallback(() => {
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
  }, [formData.customFields, compatibility]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    // Validate SKU
    if (!formData.sku || !formData.sku.trim()) {
      setSkuError('SKU is required');
      return;
    }
    
    const isSKUValid = await validateSKU(formData.sku);
    if (!isSKUValid) {
      return;
    }

    // Process images with watermark if enabled
    let processedImages = [...formData.images];
    if (addWatermark && watermarkText.trim()) {
      try {
        processedImages = await Promise.all(
          formData.images.map(async (imageSrc) => {
            if (imageSrc.startsWith('data:')) {
              return await addWatermarkToImage(imageSrc, watermarkText, watermarkPosition);
            }
            return imageSrc; // Skip watermarking for URLs
          })
        );
      } catch (error) {
        console.error('Error adding watermarks:', error);
        alert('Error adding watermarks. Proceeding without watermarks.');
      }
    }

    // Category selection is now optional

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

    onSubmit({
      ...formData,
      images: processedImages, // Use processed images with watermarks
      description,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      price: parseFloat(formData.price),
      compatibility: compatibility, // Pass the raw compatibility array with original text
      selectedCompatibility, // Pass the mapped selectedCompatibility array for filtering
    });
  }, [formData, addWatermark, watermarkText, watermarkPosition, compatibility, onSubmit]);

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
    <div className="h-full flex flex-col form-container modal-form-container">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white modal-form-section">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Product' : 'Add New Product (Flexible)'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 modal-form-content">

      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
        {/* Basic Product Information */}
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 modal-form-section">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Product Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm form-input-optimized"
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => {
                    setFormData({...formData, sku: e.target.value});
                    setSkuError(''); // Clear error when typing
                  }}
                  onBlur={() => {
                    if (formData.sku) {
                      validateSKU(formData.sku);
                    }
                  }}
                  className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm ${
                    skuError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={`Next available: ${nextAvailableSKU || 'Enter SKU'}`}
                  required
                />
                {!isEditing && nextAvailableSKU && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, sku: nextAvailableSKU.toString() }));
                      setSkuError('');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
                    title="Use next available SKU"
                  >
                    {nextAvailableSKU}
                  </button>
                )}
                <button
                  type="button"
                  onClick={generateNextSKU}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition"
                  title="Generate next available SKU"
                >
                  Generate
                </button>
              </div>
              {skuError && (
                <p className="text-red-500 text-xs mt-1">{skuError}</p>
              )}
              {!isEditing && nextAvailableSKU && (
                <p className="text-blue-600 text-xs mt-1">
                  💡 Next available SKU: {nextAvailableSKU} (click button to auto-fill)
                </p>
              )}
              {isEditing && (
                <p className="text-gray-600 text-xs mt-1">
                  📝 Editing existing product. Current SKU: {initialData?.sku}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Main Category (optional) - {categories.filter(cat => !cat.parentId).length} available
              </label>
              <select
                value={selectedMainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              >
                <option value="">Select a main category (optional)</option>
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
                    Subcategory (optional) - {subcategories.length} available
                  </label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              >
                <option value="">Select a subcategory (optional)</option>
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
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 modal-form-section">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Product Images *</h3>
          <div className="space-y-2 sm:space-y-3">
            
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
                  className={`w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
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

            {/* Watermark Controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 modal-form-section">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAddWatermark(!addWatermark);
                    }}
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                      addWatermark 
                        ? 'bg-blue-600 border-blue-600 shadow-sm' 
                        : 'bg-white border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {addWatermark && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <label className="text-sm font-medium text-gray-700 cursor-pointer">
                    Add watermark to images
                  </label>
                </div>
                
                {addWatermark && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Watermark Text</label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="e.g., OEM, NEW, SALE"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                      <select
                        value={watermarkPosition}
                        onChange={(e) => setWatermarkPosition(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Watermark Preview */}
                {addWatermark && formData.images.length > 0 && (
                  <div className="mt-4 watermark-preview-optimized">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Watermark Preview:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.images.slice(0, 2).map((image, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={image} 
                            alt={`Watermark Preview ${index + 1}`} 
                            className="w-full h-48 object-contain rounded border image-preview-optimized"
                          />
                          <div className={`absolute text-white text-sm px-4 py-2 rounded-lg font-bold shadow-2xl border border-white/20 ${
                            watermarkPosition === 'top-left' ? 'top-3 left-3' :
                            watermarkPosition === 'top-right' ? 'top-3 right-3' :
                            watermarkPosition === 'bottom-left' ? 'bottom-3 left-3' :
                            'bottom-3 right-3'
                          }`} style={{
                            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(219, 39, 119, 0.9) 100%)',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                            letterSpacing: '0.5px'
                          }}>
                            {watermarkText}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Showing preview of first {Math.min(2, formData.images.length)} image(s) with "{watermarkText}" watermark
                    </p>
                  </div>
                )}
                
              </div>
            </div>

            {/* Display uploaded images */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {formData.images?.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`Product ${index + 1}`} 
                    className="w-full h-16 sm:h-20 object-cover rounded border image-preview-optimized"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.png';
                      console.error('Failed to load image:', image);
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
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Pricing</h3>
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
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 modal-form-section">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 gap-2 sm:gap-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Product Details (Custom Fields)</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addCustomField}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700"
              >
                + Add Field
              </button>

            </div>
          </div>
          



          
          <div className="space-y-2">
            {formData.customFields.map((field) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-2 items-start custom-field-optimized">
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                    placeholder="Field name (e.g., Material, Size, Color)"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm form-input-optimized"
                  />
                </div>
                <div className="flex-1">
                  <textarea
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                    placeholder="Enter each item on a separate line&#10;Example:&#10;BMW 3-Series 2000-2007&#10;BMW X3 2004-2010&#10;Or:&#10;Lock&#10;Unlock&#10;Trunk"
                    rows={3}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm resize-vertical form-input-optimized"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {/* Detect Vehicles Button - Only show for fields that might contain vehicle info */}
                  {(field.label.toLowerCase().includes('vehicle') || 
                    field.label.toLowerCase().includes('compatibility') || 
                    field.label.toLowerCase().includes('model') ||
                    field.label.toLowerCase().includes('make') ||
                    field.label.toLowerCase().includes('year')) && (
                    <button
                      type="button"
                      onClick={() => detectVehiclesFromField(field.id)}
                      disabled={!field.value.trim() || compatLoading}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Detect vehicles from this field's text"
                    >
                      {compatLoading ? 'Detecting...' : '🚗 Detect Vehicles'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeCustomField(field.id)}
                    className="px-2 py-1 text-red-600 hover:text-red-800 text-xs"
                    title="Remove field"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            

          </div>
          
          {/* Live Preview - How the final product description will look */}
          {formData.customFields.length > 0 && (
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">📋 Live Preview - Final Product Description</h4>
              <div className="bg-gray-50 p-3 rounded border text-xs text-gray-700 max-h-60 overflow-y-auto form-scroll">
                {formData.customFields.map((field, index) => (
                  <div key={field.id} className="mb-3 last:mb-0">
                    <div className="font-semibold text-gray-900 mb-1">{field.label}</div>
                    <div className="whitespace-pre-line text-gray-600">
                      {field.value || <span className="text-gray-400 italic">(empty)</span>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is how your product details will appear to customers. Each field becomes a separate section in the product description.
              </p>
            </div>
          )}
        </div>

        {/* Vehicle Compatibility */}
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 modal-form-section">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 gap-2 sm:gap-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Vehicle Compatibility (Optional)</h3>
            <button
              type="button"
              onClick={addVehicleCompatibility}
              disabled={!compatSelectedMake}
              className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Vehicle
            </button>
          </div>

          {/* Automatic Vehicle Detection */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">🚗 Automatic Vehicle Detection</h4>
            <p className="text-xs text-blue-700 mb-3">
              Paste vehicle text here to automatically detect and add vehicle compatibility. 
              Example: &quot;BMW 3-Series 2000-2007, BMW X3 2004-2010&quot;
            </p>
            <div className="flex gap-2">
              <textarea
                value={vehicleDetectionText}
                onChange={(e) => setVehicleDetectionText(e.target.value)}
                placeholder="Paste vehicle compatibility text here..."
                rows={3}
                className="flex-1 px-2 py-1.5 border border-blue-300 rounded text-xs resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={detectVehicleCompatibility}
                disabled={!vehicleDetectionText.trim() || compatLoading}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {compatLoading ? 'Detecting...' : 'Detect Vehicles'}
              </button>
            </div>

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
              <div className="space-y-1 vehicle-compat-optimized">
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
                                    
      </form>
      </div>

      {/* Fixed Footer with Action Buttons */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-white shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {formData.images?.length || 0} images • {formData.customFields.length} custom fields
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {editingImageIndex !== null && (
        <ImageEditor
          imageSrc={editingImageSrc}
          onSave={(editedImage) => {
            const currentImages = [...formData.images];
            currentImages[editingImageIndex] = editedImage;
            setFormData({ ...formData, images: currentImages });
            setEditingImageIndex(null);
            setEditingImageSrc('');
          }}
          onCancel={() => {
            setEditingImageIndex(null);
            setEditingImageSrc('');
          }}
        />
      )}
    </div>
  );
});

export default FlexibleProductForm;