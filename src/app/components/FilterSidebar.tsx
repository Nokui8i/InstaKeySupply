'use client';
import React, { useState, useEffect } from 'react';

interface VehicleData {
  [make: string]: {
    [model: string]: string[];
  };
}

interface FilterSidebarProps {
  vehicleData: VehicleData;
  onFiltersChange: (filters: {
    make: string;
    model: string;
    yearRange: string;
  }) => void;
  onClearFilters: () => void;
}

export default function FilterSidebar({ vehicleData, onFiltersChange, onClearFilters }: FilterSidebarProps) {
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYearRange, setSelectedYearRange] = useState('');

  // Update filters when selections change
  useEffect(() => {
    if (selectedMake && selectedModel && selectedYearRange) {
      onFiltersChange({
        make: selectedMake,
        model: selectedModel,
        yearRange: selectedYearRange
      });
    }
  }, [selectedMake, selectedModel, selectedYearRange, onFiltersChange]);

  const handleClearFilters = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYearRange('');
    onClearFilters();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Vehicle Filter</h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        {/* Make Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Make
          </label>
          <select
            value={selectedMake}
            onChange={(e) => {
              setSelectedMake(e.target.value);
              setSelectedModel('');
              setSelectedYearRange('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Make</option>
            {Object.keys(vehicleData).map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              setSelectedYearRange('');
            }}
            disabled={!selectedMake}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select Model</option>
            {selectedMake && vehicleData[selectedMake] && Object.keys(vehicleData[selectedMake]).map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* Year Range Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Range
          </label>
          <select
            value={selectedYearRange}
            onChange={(e) => setSelectedYearRange(e.target.value)}
            disabled={!selectedModel}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select Year Range</option>
            {selectedModel && vehicleData[selectedMake]?.[selectedModel]?.map((yearRange: string) => (
              <option key={yearRange} value={yearRange}>{yearRange}</option>
            ))}
          </select>
        </div>

        {/* Selected Filters Display */}
        {selectedMake && selectedModel && selectedYearRange && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Vehicle:</h4>
            <p className="text-sm text-blue-800">
              {selectedMake} {selectedModel}
            </p>
            <p className="text-sm text-blue-700">
              Years: {selectedYearRange}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="mb-2">💡 <strong>How to use:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Select your vehicle make</li>
            <li>Choose your specific model</li>
            <li>Pick the year range</li>
            <li>View compatible products</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 