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
    // Trigger filter whenever any selection changes, even if not all fields are filled
    if (selectedMake) {
      onFiltersChange({
        make: selectedMake,
        model: selectedModel || '',
        yearRange: selectedYearRange || ''
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Vehicle Filter</h3>
      </div>

      <div className="space-y-4">
        {/* Make Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle
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
            <option value="">Select Vehicle</option>
            {Object.keys(vehicleData).map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
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
            <option value="">Select Model (Optional)</option>
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
            <option value="">Select Year Range (Optional)</option>
            {selectedModel && vehicleData[selectedMake]?.[selectedModel]?.map((yearRange: string) => (
              <option key={yearRange} value={yearRange}>{yearRange}</option>
            ))}
          </select>
        </div>

        {/* Selected Filters Display */}
        {(selectedMake || selectedModel || selectedYearRange) && (
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
          <p className="mb-2">💡 <strong>Flexible Filtering:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Vehicle only:</strong> See all products for a specific vehicle</li>
            <li><strong>Vehicle + Model:</strong> See all products for a specific vehicle + model</li>
            <li><strong>Vehicle + Model + Year:</strong> See specific products for exact match</li>
          </ol>
          <p className="mt-2 text-xs">Model and Year are optional - leave empty to see broader results!</p>
          <p className="mt-1 text-xs text-blue-600">💡 <strong>Tip:</strong> Start with just Vehicle to see all available options!</p>
        </div>
      </div>
    </div>
  );
} 