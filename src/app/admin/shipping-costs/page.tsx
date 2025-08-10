"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaTruck } from 'react-icons/fa';

interface ShippingCost {
  id?: string;
  name: string;
  minOrderAmount: number;
  maxOrderAmount?: number;
  cost: number;
  description: string;
  isActive: boolean;
  priority: number;
  regions?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export default function ShippingCostsPage() {
  const [shippingCosts, setShippingCosts] = useState<ShippingCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<ShippingCost>({
    name: '',
    minOrderAmount: 0,
    maxOrderAmount: undefined,
    cost: 0,
    description: '',
    isActive: true,
    priority: 0,
    regions: [],
  });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load shipping costs
  useEffect(() => {
    loadShippingCosts();
  }, []);

  const loadShippingCosts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'shippingCosts'), orderBy('priority', 'asc'));
      const snapshot = await getDocs(q);
      const costs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShippingCost[];
      setShippingCosts(costs);
    } catch (err) {
      console.error('Error loading shipping costs:', err);
      setError('Failed to load shipping costs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        // Update existing
        const docRef = doc(db, 'shippingCosts', editingId);
        await updateDoc(docRef, {
          ...editingCost,
          updatedAt: new Date(),
        });
        setSuccess('Shipping cost updated successfully');
      } else {
        // Create new
        await addDoc(collection(db, 'shippingCosts'), {
          ...editingCost,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setSuccess('Shipping cost created successfully');
      }

      setShowForm(false);
      setEditingId(null);
      setEditingCost({
        name: '',
        minOrderAmount: 0,
        maxOrderAmount: undefined,
        cost: 0,
        description: '',
        isActive: true,
        priority: 0,
        regions: [],
      });
      loadShippingCosts();
    } catch (err) {
      console.error('Error saving shipping cost:', err);
      setError('Failed to save shipping cost');
    }
  };

  const handleEdit = (cost: ShippingCost) => {
    setEditingId(cost.id || null);
    setEditingCost(cost);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping cost?')) return;

    try {
      await deleteDoc(doc(db, 'shippingCosts', id));
      setSuccess('Shipping cost deleted successfully');
      loadShippingCosts();
    } catch (err) {
      console.error('Error deleting shipping cost:', err);
      setError('Failed to delete shipping cost');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingCost({
      name: '',
      minOrderAmount: 0,
      maxOrderAmount: undefined,
      cost: 0,
      description: '',
      isActive: true,
      priority: 0,
      regions: [],
    });
  };

  const addRegion = () => {
    setEditingCost(prev => ({
      ...prev,
      regions: [...(prev.regions || []), '']
    }));
  };

  const removeRegion = (index: number) => {
    setEditingCost(prev => ({
      ...prev,
      regions: prev.regions?.filter((_, i) => i !== index)
    }));
  };

  const updateRegion = (index: number, value: string) => {
    setEditingCost(prev => ({
      ...prev,
      regions: prev.regions?.map((region, i) => i === index ? value : region)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FaTruck className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Shipping Costs</h1>
        </div>
        <p className="text-gray-600">Manage shipping costs and delivery options</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Add New Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          Add Shipping Cost
        </button>
      </div>

      {/* Shipping Costs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shippingCosts.map((cost) => (
                <tr key={cost.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cost.name}</div>
                      <div className="text-sm text-gray-500">{cost.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${cost.minOrderAmount.toFixed(2)}
                    {cost.maxOrderAmount && ` - $${cost.maxOrderAmount.toFixed(2)}`}
                    {!cost.maxOrderAmount && '+'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${cost.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cost.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cost.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {cost.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cost)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => cost.id && handleDelete(cost.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Shipping Cost' : 'Add New Shipping Cost'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCost.name}
                      onChange={(e) => setEditingCost(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Standard Shipping, Free Shipping"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={editingCost.cost}
                        onChange={(e) => setEditingCost(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Order Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={editingCost.minOrderAmount}
                        onChange={(e) => setEditingCost(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Order Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingCost.maxOrderAmount || ''}
                        onChange={(e) => setEditingCost(prev => ({ 
                          ...prev, 
                          maxOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                        }))}
                        className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingCost.priority}
                      onChange={(e) => setEditingCost(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers = higher priority</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editingCost.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditingCost(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingCost.description}
                    onChange={(e) => setEditingCost(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe this shipping option..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regions (Optional)
                  </label>
                  <div className="space-y-2">
                    {editingCost.regions?.map((region, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => updateRegion(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., CA, NY, TX"
                        />
                        <button
                          type="button"
                          onClick={() => removeRegion(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRegion}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <FaPlus className="w-3 h-3" />
                      Add Region
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all regions</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FaSave className="w-4 h-4" />
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
