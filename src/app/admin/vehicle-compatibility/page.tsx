'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from "../layout";
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface VehicleData {
  [make: string]: {
    [model: string]: string[];
  };
}

// Sortable Make Item Component
function SortableMakeItem({
  make,
  selectedMake,
  onSelect,
  onRemove
}: {
  make: string;
  selectedMake: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: make });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 sm:p-3 rounded border cursor-pointer transition-colors ${selectedMake === make ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} flex items-center justify-between`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded transition-colors cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <Bars3Icon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
        </button>
        <span className={`${selectedMake === make ? 'font-medium text-blue-900' : 'text-gray-700'}`}>{make}</span>
      </div>
      <button
        className="text-red-500 hover:text-red-700 p-1"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        ×
      </button>
    </div>
  );
}

// Sortable Model Item Component
function SortableModelItem({ 
  model, 
  selectedModel, 
  selectedMake,
  editingModel,
  editingModelValue,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onEditingValueChange
}: {
  model: string;
  selectedModel: string;
  selectedMake: string;
  editingModel: string;
  editingModelValue: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
  onEditingValueChange: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: model, disabled: editingModel === model });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (editingModel === model) {
    return (
      <div className="p-3 rounded border bg-blue-50 border-blue-300 flex items-center gap-2">
        <input
          type="text"
          value={editingModelValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        <button
          className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition"
          onClick={onSaveEdit}
        >
          ✓
        </button>
        <button
          className="px-2 py-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition"
          onClick={onCancelEdit}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 sm:p-3 rounded border cursor-pointer transition-colors ${selectedModel === model ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} flex items-center justify-between`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded transition-colors cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <Bars3Icon className="w-4 h-4 text-gray-400" />
        </button>
        <span className={`${selectedModel === model ? 'font-medium text-blue-900' : 'text-gray-700'}`}>{model}</span>
      </div>
      <div className="flex gap-1">
        <button
          className="text-blue-600 hover:text-blue-800 p-1"
          onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
        >
          ✏️
        </button>
        <button
          className="text-red-500 hover:text-red-700 p-1"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Sortable Year Range Item Component
function SortableYearRangeItem({
  yearRange,
  editingYearRange,
  editingYearRangeValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onEditingValueChange
}: {
  yearRange: string;
  editingYearRange: string;
  editingYearRangeValue: string;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
  onEditingValueChange: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: yearRange, disabled: editingYearRange === yearRange });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (editingYearRange === yearRange) {
    return (
      <div className="p-3 rounded border bg-blue-50 border-blue-300 flex items-center gap-2">
        <input
          type="text"
          value={editingYearRangeValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        <button
          className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition"
          onClick={onSaveEdit}
        >
          ✓
        </button>
        <button
          className="px-2 py-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition"
          onClick={onCancelEdit}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-2 sm:p-3 rounded border bg-gray-50 border-gray-200 flex items-center justify-between"
    >
      <div className="flex items-center gap-2 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded transition-colors cursor-grab active:cursor-grabbing"
        >
          <Bars3Icon className="w-4 h-4 text-gray-400" />
        </button>
        <span className="text-gray-700">{yearRange}</span>
      </div>
      <div className="flex gap-1">
        <button
          className="text-blue-600 hover:text-blue-800 p-1"
          onClick={onStartEdit}
        >
          ✏️
        </button>
        <button
          className="text-red-500 hover:text-red-700 p-1"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function VehicleCompatibilityContent() {
  const [data, setData] = useState<VehicleData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMake, setNewMake] = useState('');
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [newModel, setNewModel] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [newYearRange, setNewYearRange] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Editing states
  const [editingYearRange, setEditingYearRange] = useState<string>('');
  const [editingYearRangeValue, setEditingYearRangeValue] = useState<string>('');
  const [editingModel, setEditingModel] = useState<string>('');
  const [editingModelValue, setEditingModelValue] = useState<string>('');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vehicle-compatibility/makes-models');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError('Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add Make
  const handleAddMake = async () => {
    if (!newMake.trim()) return;
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make: newMake.trim() })
    });
    setNewMake('');
    fetchData();
  };

  // Remove Make
  const handleRemoveMake = async (make: string) => {
    if (!window.confirm(`Are you sure you want to delete the make "${make}" and all its models and year ranges?\n\nThis action cannot be undone.`)) return;
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make })
    });
    if (selectedMake === make) {
      setSelectedMake('');
      setSelectedModel('');
    }
    fetchData();
  };

  // Add Model
  const handleAddModel = async () => {
    if (!selectedMake || !newModel.trim()) return;
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make: selectedMake, model: newModel.trim() })
    });
    setNewModel('');
    fetchData();
  };

  // Remove Model
  const handleRemoveModel = async (make: string, model: string) => {
    if (!window.confirm(`Are you sure you want to delete the model "${model}" and all its year ranges?\n\nThis action cannot be undone.`)) return;
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make, model })
    });
    if (selectedModel === model) setSelectedModel('');
    fetchData();
  };

  // Start editing model
  const startEditModel = (model: string) => {
    setEditingModel(model);
    setEditingModelValue(model);
  };

  // Save edited model
  const saveEditModel = async () => {
    if (!selectedMake || !editingModel || !editingModelValue.trim()) return;
    
    try {
      // First, add the new model name
      await fetch('/api/vehicle-compatibility/makes-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          make: selectedMake, 
          model: editingModelValue.trim(),
          yearRanges: data[selectedMake]?.[editingModel] || []
        })
      });
      
      // Then, remove the old model name
      await fetch('/api/vehicle-compatibility/makes-models', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ make: selectedMake, model: editingModel })
      });
      
      setEditingModel('');
      setEditingModelValue('');
      fetchData();
    } catch (error) {
      console.error('Error updating model:', error);
      setError('Failed to update model');
    }
  };

  // Cancel editing model
  const cancelEditModel = () => {
    setEditingModel('');
    setEditingModelValue('');
  };

  // Add Year Range
  const handleAddYearRange = async () => {
    if (!selectedMake || !selectedModel || !newYearRange.trim()) return;
    
    // Validate year range format
    const yearRangeRegex = /^\d{4}(-\d{4})?$/;
    if (!yearRangeRegex.test(newYearRange.trim())) {
      setError('Year range must be in format: YYYY or YYYY-YYYY (e.g., 2010 or 2010-2015)');
      return;
    }
    
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make: selectedMake, model: selectedModel, yearRange: newYearRange.trim() })
    });
    setNewYearRange('');
    setError(null);
    fetchData();
  };

  // Start editing year range
  const startEditYearRange = (yearRange: string) => {
    setEditingYearRange(yearRange);
    setEditingYearRangeValue(yearRange);
  };

  // Save edited year range
  const saveEditYearRange = async () => {
    if (!selectedMake || !selectedModel || !editingYearRange || !editingYearRangeValue.trim()) return;
    
    // Validate year range format
    const yearRangeRegex = /^\d{4}(-\d{4})?$/;
    if (!yearRangeRegex.test(editingYearRangeValue.trim())) {
      setError('Year range must be in format: YYYY or YYYY-YYYY (e.g., 2010 or 2010-2015)');
      return;
    }
    
    try {
      // First, add the new year range
      await fetch('/api/vehicle-compatibility/makes-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          make: selectedMake, 
          model: selectedModel, 
          yearRange: editingYearRangeValue.trim() 
        })
      });
      
      // Then, remove the old year range
      await fetch('/api/vehicle-compatibility/makes-models', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          make: selectedMake, 
          model: selectedModel, 
          yearRange: editingYearRange 
        })
      });
      
      setEditingYearRange('');
      setEditingYearRangeValue('');
      setError(null);
      fetchData();
    } catch (error) {
      console.error('Error updating year range:', error);
      setError('Failed to update year range');
    }
  };

  // Cancel editing year range
  const cancelEditYearRange = () => {
    setEditingYearRange('');
    setEditingYearRangeValue('');
    setError(null);
  };

  // Remove Year Range
  const handleRemoveYearRange = async (make: string, model: string, yearRange: string) => {
    if (!window.confirm(`Are you sure you want to delete the year range "${yearRange}"?\n\nThis action cannot be undone.`)) return;
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make, model, yearRange })
    });
    fetchData();
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for models
  const handleDragEndModels = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!selectedMake || !over || active.id === over.id) return;

    const models = Object.keys(data[selectedMake] || {});
    const oldIndex = models.indexOf(active.id as string);
    const newIndex = models.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedModels = arrayMove(models, oldIndex, newIndex);
      
      // Update local state immediately
      const newData = { ...data };
      const newModelsObject: { [key: string]: string[] } = {};
      reorderedModels.forEach(modelName => {
        newModelsObject[modelName] = data[selectedMake][modelName];
      });
      newData[selectedMake] = newModelsObject;
      setData(newData);

      // Save to API
      try {
        await fetch('/api/vehicle-compatibility/makes-models', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ make: selectedMake, orderedModels: reorderedModels })
        });
      } catch (error) {
        console.error('Error reordering models:', error);
        setError('Failed to reorder models');
        fetchData(); // Revert on error
      }
    }
  };

  // Handle drag end for year ranges
  const handleDragEndYearRanges = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!selectedMake || !selectedModel || !over || active.id === over.id) return;

    const yearRanges = data[selectedMake]?.[selectedModel] || [];
    const oldIndex = yearRanges.indexOf(active.id as string);
    const newIndex = yearRanges.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedYearRanges = arrayMove(yearRanges, oldIndex, newIndex);
      
      // Update local state immediately
      const newData = { ...data };
      newData[selectedMake][selectedModel] = reorderedYearRanges;
      setData(newData);

      // Save to API
      try {
        await fetch('/api/vehicle-compatibility/makes-models', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            make: selectedMake, 
            model: selectedModel, 
            orderedYearRanges: reorderedYearRanges 
          })
        });
      } catch (error) {
        console.error('Error reordering year ranges:', error);
        setError('Failed to reorder year ranges');
        fetchData(); // Revert on error
      }
    }
  };

  // Handle drag end for makes
  const handleDragEndMakes = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const makes = Object.keys(data);
    const oldIndex = makes.indexOf(active.id as string);
    const newIndex = makes.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedMakes = arrayMove(makes, oldIndex, newIndex);
      
      // Update local state immediately
      const newData: VehicleData = {};
      reorderedMakes.forEach(make => {
        newData[make] = data[make];
      });
      setData(newData);

      // Save to API
      try {
        await fetch('/api/vehicle-compatibility/makes-models', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedMakes: reorderedMakes })
        });
      } catch (error) {
        console.error('Error reordering makes:', error);
        setError('Failed to reorder makes');
        fetchData(); // Revert on error
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading vehicle data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Vehicle Compatibility</h1>
            <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1">
              Manage vehicle makes, models, and year ranges
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

                 {/* Mobile Layout */}
         <div className="lg:hidden space-y-4">
           {/* Makes Section */}
           <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
             <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Vehicle Makes</h2>
             <div className="flex gap-2 mb-3">
               <input
                 className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="Add new make..."
                 value={newMake}
                 onChange={e => setNewMake(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleAddMake()}
               />
               <button
                 className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap"
                 onClick={handleAddMake}
               >
                 Add
               </button>
             </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndMakes}
            >
              <SortableContext
                items={Object.keys(data)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.keys(data).map(make => (
                    <SortableMakeItem
                      key={make}
                      make={make}
                      selectedMake={selectedMake}
                      onSelect={() => setSelectedMake(make)}
                      onRemove={() => handleRemoveMake(make)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Models Section */}
          {selectedMake && (
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Models for {selectedMake}</h2>
                                            <div className="flex gap-2 mb-3">
                 <input
                   className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Add new model..."
                   value={newModel}
                   onChange={e => setNewModel(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleAddModel()}
                 />
                 <button
                   className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap"
                   onClick={handleAddModel}
                 >
                   Add
                 </button>
               </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndModels}
              >
                <SortableContext
                  items={Object.keys(data[selectedMake] || {})}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.keys(data[selectedMake] || {}).map(model => (
                      <SortableModelItem
                        key={model}
                        model={model}
                        selectedModel={selectedModel}
                        selectedMake={selectedMake}
                        editingModel={editingModel}
                        editingModelValue={editingModelValue}
                        onSelect={() => setSelectedModel(model)}
                        onStartEdit={() => startEditModel(model)}
                        onSaveEdit={saveEditModel}
                        onCancelEdit={cancelEditModel}
                        onRemove={() => handleRemoveModel(selectedMake, model)}
                        onEditingValueChange={setEditingModelValue}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Year Ranges Section */}
          {selectedMake && selectedModel && (
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Year Ranges for {selectedModel}</h2>
              <p className="text-xs text-gray-600 mb-3">Format: YYYY or YYYY-YYYY (e.g., 2010 or 2010-2015)</p>
                                            <div className="flex gap-2 mb-3">
                 <input
                   className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Add new year range..."
                   value={newYearRange}
                   onChange={e => setNewYearRange(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleAddYearRange()}
                 />
                 <button
                   className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap"
                   onClick={handleAddYearRange}
                 >
                   Add
                 </button>
               </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndYearRanges}
              >
                <SortableContext
                  items={data[selectedMake]?.[selectedModel] || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(data[selectedMake]?.[selectedModel] || []).map(yearRange => (
                      <SortableYearRangeItem
                        key={yearRange}
                        yearRange={yearRange}
                        editingYearRange={editingYearRange}
                        editingYearRangeValue={editingYearRangeValue}
                        onStartEdit={() => startEditYearRange(yearRange)}
                        onSaveEdit={saveEditYearRange}
                        onCancelEdit={cancelEditYearRange}
                        onRemove={() => handleRemoveYearRange(selectedMake, selectedModel, yearRange)}
                        onEditingValueChange={setEditingYearRangeValue}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

                 {/* Desktop Layout */}
         <div className="hidden lg:flex gap-6">
           {/* Makes Panel */}
           <div className="w-80 flex-shrink-0">
             <div className="bg-white rounded-lg shadow-sm border p-4 h-fit">
               <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Makes</h2>
                               <div className="flex gap-1 mb-4">
                  <input
                    className="flex-1 border border-gray-300 rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add new make..."
                    value={newMake}
                    onChange={e => setNewMake(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddMake()}
                  />
                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap"
                    onClick={handleAddMake}
                  >
                    Add
                  </button>
                </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndMakes}
              >
                <SortableContext
                  items={Object.keys(data)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
                    {Object.keys(data).map(make => (
                      <SortableMakeItem
                        key={make}
                        make={make}
                        selectedMake={selectedMake}
                        onSelect={() => setSelectedMake(make)}
                        onRemove={() => handleRemoveMake(make)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

                     {/* Models Panel */}
           {selectedMake && (
             <div className="w-80 flex-shrink-0">
               <div className="bg-white rounded-lg shadow-sm border p-4 h-fit">
                 <h2 className="text-lg font-semibold text-gray-900 mb-4">Models for {selectedMake}</h2>
                                   <div className="flex gap-1 mb-4">
                    <input
                      className="flex-1 border border-gray-300 rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add new model..."
                      value={newModel}
                      onChange={e => setNewModel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddModel()}
                    />
                    <button
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap"
                      onClick={handleAddModel}
                    >
                      Add
                    </button>
                  </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndModels}
                >
                  <SortableContext
                    items={Object.keys(data[selectedMake] || {})}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
                      {Object.keys(data[selectedMake] || {}).map(model => (
                        <SortableModelItem
                          key={model}
                          model={model}
                          selectedModel={selectedModel}
                          selectedMake={selectedMake}
                          editingModel={editingModel}
                          editingModelValue={editingModelValue}
                          onSelect={() => setSelectedModel(model)}
                          onStartEdit={() => startEditModel(model)}
                          onSaveEdit={saveEditModel}
                          onCancelEdit={cancelEditModel}
                          onRemove={() => handleRemoveModel(selectedMake, model)}
                          onEditingValueChange={setEditingModelValue}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

                     {/* Year Ranges Panel */}
           {selectedMake && selectedModel && (
             <div className="w-80 flex-shrink-0">
               <div className="bg-white rounded-lg shadow-sm border p-4 h-fit">
                 <h2 className="text-lg font-semibold text-gray-900 mb-4">Year Ranges for {selectedModel}</h2>
                 <p className="text-sm text-gray-600 mb-4">Format: YYYY or YYYY-YYYY (e.g., 2010 or 2010-2015)</p>
                                   <div className="flex gap-1 mb-4">
                    <input
                      className="flex-1 border border-gray-300 rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add new year range..."
                      value={newYearRange}
                      onChange={e => setNewYearRange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddYearRange()}
                    />
                    <button
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition flex-shrink-0 whitespace-nowrap"
                      onClick={handleAddYearRange}
                    >
                      Add
                    </button>
                  </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndYearRanges}
                >
                  <SortableContext
                    items={data[selectedMake]?.[selectedModel] || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
                      {(data[selectedMake]?.[selectedModel] || []).map(yearRange => (
                        <SortableYearRangeItem
                          key={yearRange}
                          yearRange={yearRange}
                          editingYearRange={editingYearRange}
                          editingYearRangeValue={editingYearRangeValue}
                          onStartEdit={() => startEditYearRange(yearRange)}
                          onSaveEdit={saveEditYearRange}
                          onCancelEdit={cancelEditYearRange}
                          onRemove={() => handleRemoveYearRange(selectedMake, selectedModel, yearRange)}
                          onEditingValueChange={setEditingYearRangeValue}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehicleCompatibilityAdmin() {
  return (
    <AdminLayout>
      <VehicleCompatibilityContent />
    </AdminLayout>
  );
}