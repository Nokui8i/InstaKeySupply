"use client";
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaTruck } from 'react-icons/fa';

interface ShippingCost {
  id?: string;
  cost: number;
  updatedAt?: any;
}

export default function ShippingCostsPage() {
  const [shippingCost, setShippingCost] = useState<ShippingCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cost, setCost] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load shipping cost
  useEffect(() => {
    loadShippingCost();
  }, []);

  const loadShippingCost = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'shippingCosts'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const costData = snapshot.docs[0];
        setShippingCost({
          id: costData.id,
          cost: costData.data().cost,
          updatedAt: costData.data().updatedAt
        });
        setCost(costData.data().cost);
      }
    } catch (err) {
      console.error('Error loading shipping cost:', err);
      setError('Failed to load shipping cost');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (shippingCost?.id) {
        // Update existing
        const docRef = doc(db, 'shippingCosts', shippingCost.id);
        await updateDoc(docRef, {
          cost: cost,
          updatedAt: new Date(),
        });
        setSuccess('Shipping cost updated successfully');
      } else {
        // Create new
        await addDoc(collection(db, 'shippingCosts'), {
          cost: cost,
          updatedAt: new Date(),
        });
        setSuccess('Shipping cost created successfully');
      }

      setEditing(false);
      loadShippingCost();
    } catch (err) {
      console.error('Error saving shipping cost:', err);
      setError('Failed to save shipping cost');
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setCost(shippingCost?.cost || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FaTruck className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Shipping Cost</h1>
        </div>
        <p className="text-gray-600">Set the shipping cost for all orders</p>
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

      {/* Current Shipping Cost Display */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Current Shipping Cost</h3>
            <p className="text-3xl font-bold text-blue-600">${shippingCost?.cost?.toFixed(2) || '0.00'}</p>
            {shippingCost?.updatedAt && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {shippingCost.updatedAt.toDate().toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaEdit className="w-4 h-4" />
            Edit Cost
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Update Shipping Cost</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Cost *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <FaSave className="w-4 h-4" />
                Update Cost
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
      )}
    </div>
  );
}
