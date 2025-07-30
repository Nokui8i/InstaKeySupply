'use client';
import React, { useEffect, useState } from 'react';

interface VehicleData {
  [make: string]: {
    [model: string]: string[];
  };
}

export default function VehicleCompatibilityAdmin() {
  const [data, setData] = useState<VehicleData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMake, setNewMake] = useState('');
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [newModel, setNewModel] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [newYearRange, setNewYearRange] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

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
    if (!window.confirm(`Are you sure you want to delete the make "${make}" and all its models and year ranges?`)) return;
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
    if (!window.confirm(`Are you sure you want to delete the model "${model}" and all its year ranges?`)) return;
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make, model })
    });
    if (selectedModel === model) setSelectedModel('');
    fetchData();
  };

  // Add Year Range
  const handleAddYearRange = async () => {
    if (!selectedMake || !selectedModel || !newYearRange.trim()) return;
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make: selectedMake, model: selectedModel, yearRange: newYearRange.trim() })
    });
    setNewYearRange('');
    fetchData();
  };

  // Remove Year Range
  const handleRemoveYearRange = async (make: string, model: string, yearRange: string) => {
    if (!window.confirm(`Are you sure you want to delete the year range "${yearRange}"?`)) return;
    await fetch('/api/vehicle-compatibility/makes-models', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make, model, yearRange })
    });
    fetchData();
  };

  // Responsive sidebar toggle
  const handleSidebarToggle = () => setShowSidebar(v => !v);

  return (
    <div className="max-w-7xl mx-auto p-2 md:p-6 min-h-[80vh]">
      <h1 className="text-2xl font-bold mb-6 text-blue-800 text-center md:text-left">Vehicle Compatibility Management</h1>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden fixed top-20 left-2 z-30 bg-blue-600 text-white rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={handleSidebarToggle}
          aria-label="Show Makes Sidebar"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        {/* Sidebar: Makes */}
        <div className={`fixed md:static z-20 top-0 left-0 h-full md:h-auto w-64 min-w-[200px] bg-white rounded-xl shadow-lg border border-blue-200 p-4 transition-transform duration-300 md:translate-x-0 ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:block`}
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-blue-700">Makes</h2>
            <button className="md:hidden text-gray-500 hover:text-blue-700" onClick={handleSidebarToggle} aria-label="Close Sidebar">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              placeholder="Add new make..."
              value={newMake}
              onChange={e => setNewMake(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMake()}
            />
            <button
              className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700"
              onClick={handleAddMake}
            >Add</button>
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '420px' }}>
            {Object.keys(data).sort().map(make => (
              <div key={make} className={`px-3 py-2 rounded-lg border ${selectedMake === make ? 'bg-blue-100 border-blue-400 font-bold shadow' : 'bg-gray-100 border-gray-300'} flex items-center gap-2 cursor-pointer transition-all duration-150`} onClick={() => { setSelectedMake(make); setSelectedModel(''); if (window.innerWidth < 768) setShowSidebar(false); }}>
                <span className="truncate text-base md:text-sm">{make}</span>
                <button className="ml-auto text-red-500 hover:text-red-700" onClick={e => { e.stopPropagation(); handleRemoveMake(make); }} aria-label={`Remove ${make}`}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Overlay for mobile sidebar */}
        {showSidebar && <div className="fixed inset-0 bg-black/30 z-10 md:hidden" onClick={handleSidebarToggle}></div>}
        {/* Models Panel */}
        <div className="w-64 min-w-[200px] md:w-64 md:min-w-[200px] flex-shrink-0">
          {error && <div className="text-red-600 mb-4">{error}</div>}
          {selectedMake && (
            <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-4 mb-6 animate-in fade-in duration-200 w-full">
              <h2 className="text-lg font-semibold mb-2 text-blue-700">Models for {selectedMake}</h2>
              <div className="flex flex-col md:flex-row gap-2 mb-4 w-full">
                <input
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-[120px] w-full md:w-auto"
                  placeholder="Add new model..."
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddModel()}
                />
                <button
                  className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 w-full md:w-auto"
                  onClick={handleAddModel}
                >Add</button>
              </div>
              <ul className="divide-y divide-blue-100 overflow-y-auto" style={{ maxHeight: '420px' }}>
                {Object.keys(data[selectedMake] || {}).sort().map(model => (
                  <li key={model} className={`flex items-center justify-between py-2 px-2 rounded hover:bg-blue-50 transition-all duration-150 ${selectedModel === model ? 'bg-blue-100 border-l-4 border-blue-400 font-bold shadow' : ''}`}
                    onClick={() => setSelectedModel(model)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="truncate text-base md:text-sm">{model}</span>
                    <button className="ml-2 text-red-500 hover:text-red-700 px-2 py-1 rounded focus:outline-none" onClick={e => { e.stopPropagation(); handleRemoveModel(selectedMake, model); }} aria-label={`Remove ${model}`}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* Year Ranges Panel (right of models) */}
        {selectedMake && selectedModel && (
          <div className="w-64 min-w-[200px] md:w-64 md:min-w-[200px] flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-4 mb-6 animate-in fade-in duration-200 w-full">
              <h2 className="text-lg font-semibold mb-2 text-blue-700">Year Ranges for {selectedModel} ({selectedMake})</h2>
              <div className="flex flex-col md:flex-row gap-2 mb-4 w-full">
                <input
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-[120px] w-full md:w-auto"
                  placeholder="Add new year range... (e.g. 2010-2015)"
                  value={newYearRange}
                  onChange={e => setNewYearRange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddYearRange()}
                />
                <button
                  className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 w-full md:w-auto"
                  onClick={handleAddYearRange}
                >Add</button>
              </div>
              <ul className="divide-y divide-blue-100 overflow-y-auto" style={{ maxHeight: '420px' }}>
                {(data[selectedMake]?.[selectedModel] || []).map(yearRange => (
                  <li key={yearRange} className="flex items-center justify-between py-2 px-2 rounded hover:bg-blue-50 transition-all duration-150">
                    <span className="truncate text-base md:text-sm">{yearRange}</span>
                    <button className="ml-2 text-red-500 hover:text-red-700 px-2 py-1 rounded focus:outline-none" onClick={() => handleRemoveYearRange(selectedMake, selectedModel, yearRange)} aria-label={`Remove ${yearRange}`}>×</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {loading && <div className="text-gray-500">Loading...</div>}
      </div>
    </div>
  );
} 