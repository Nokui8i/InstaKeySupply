"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from "firebase/firestore";

import { useAdminAuth } from "../context/AdminAuthContext";
import AdminLayout from "../layout";

interface PromoCode {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiresAt?: Timestamp | null;
  usageLimit?: number | undefined;
  usedCount?: number;
  active: boolean;
  allowedEmail?: string;
}

const DEFAULT_NEW: PromoCode = {
  code: "",
  type: "percent",
  value: 10,
  expiresAt: null,
  usageLimit: undefined,
  usedCount: 0,
  active: true,
  allowedEmail: "",
};

function PromoCodesContent() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newCode, setNewCode] = useState<PromoCode>({ ...DEFAULT_NEW });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    async function fetchCodes() {
      const q = query(collection(db, "promoCodes"), orderBy("code"));
      const snap = await getDocs(q);
      setCodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode)));
      setLoading(false);
    }
    fetchCodes();
  }, []);

  const handleSave = async () => {
    setFormError("");
    if (!newCode.code || newCode.code.trim() === "") {
      setFormError("Promo code is required.");
      return;
    }
    if (!newCode.value || newCode.value <= 0) {
      setFormError("Discount value must be greater than 0.");
      return;
    }
    if (newCode.allowedEmail && newCode.allowedEmail.trim() !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newCode.allowedEmail)) {
      setFormError("Allowed email must be a valid email address.");
      return;
    }
    setSaving(true);
    try {
      // Remove id field and handle Timestamp properly before saving to Firestore
      const { id, ...codeToSave } = newCode;
      
      // Clean up the data before saving
      codeToSave.code = codeToSave.code.trim().toUpperCase();
      codeToSave.usedCount = codeToSave.usedCount || 0;
      codeToSave.active = Boolean(codeToSave.active);
      
      // Handle optional fields
      if (codeToSave.allowedEmail && codeToSave.allowedEmail.trim() === "") {
        delete codeToSave.allowedEmail;
      }
      if (!codeToSave.usageLimit) {
        delete codeToSave.usageLimit;
      }
      if (!codeToSave.expiresAt) {
        delete codeToSave.expiresAt;
      }
      
      if (editingId) {
        await updateDoc(doc(db, "promoCodes", editingId), codeToSave);
        setCodes(codes => codes.map(c => c.id === editingId ? { ...newCode, id: editingId } : c));
        setMsg("Promo code updated!");
      } else {
        const ref = await addDoc(collection(db, "promoCodes"), codeToSave);
        setCodes(codes => [...codes, { ...newCode, id: ref.id }]);
        setMsg("Promo code added!");
        
        // Send email notification if this is a restricted promo code
        if (newCode.allowedEmail) {
          try {
            await fetch('/api/send-promo-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerEmail: newCode.allowedEmail,
                promoCode: newCode.code,
                discountType: newCode.type,
                discountValue: newCode.value,
                expiresAt: newCode.expiresAt,
              }),
            });
            setMsg("Promo code added and notification email sent!");
          } catch (emailError) {
            console.error('Failed to send promo notification email:', emailError);
            setMsg("Promo code added, but failed to send notification email.");
          }
        }
      }
      setNewCode({ ...DEFAULT_NEW });
      setEditingId(null);
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      console.error('Promo code save error:', error);
      setMsg(`Failed to save promo code: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMsg(""), 3000);
    }
    setSaving(false);
  };

  const handleEdit = (code: PromoCode) => {
    setNewCode({ ...code });
    setEditingId(code.id!);
    setFormError("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this promo code?")) return;
    await deleteDoc(doc(db, "promoCodes", id));
    setCodes(codes => codes.filter(c => c.id !== id));
    setMsg("Promo code deleted.");
    setTimeout(() => setMsg(""), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading promo codes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Promo Codes</h1>
            <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1">
              Total: {codes.length} codes
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-6">
        {/* Add/Edit Form */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              {editingId ? "Edit Promo Code" : "Add Promo Code"}
              {newCode.active ? (
                <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">Active</span>
              ) : (
                <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">Inactive</span>
              )}
            </h2>
          </div>
          
          <div className="flex flex-col gap-3 sm:gap-4">
              {/* Required Fields - Promo Code Basics */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Promo Code Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium mb-1 text-gray-700">Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. SUMMER20"
                      value={newCode.code}
                      onChange={e => setNewCode(c => ({ ...c, code: e.target.value.toUpperCase() }))}
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700">Type <span className="text-red-500">*</span></label>
                    <select
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newCode.type}
                      onChange={e => setNewCode(c => ({ ...c, type: e.target.value as "percent" | "fixed" }))}
                    >
                      <option value="percent">% Off</option>
                      <option value="fixed">$ Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700">Value <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newCode.value}
                      min={1}
                      onChange={e => setNewCode(c => ({ ...c, value: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Fields - Restrictions & Settings */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Optional Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700">Expiration Date</label>
                    <input
                      type="date"
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newCode.expiresAt ? new Date(newCode.expiresAt.seconds * 1000).toISOString().slice(0, 10) : ""}
                      onChange={e => setNewCode(c => ({ ...c, expiresAt: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null }))}
                    />
                    <div className="text-xs text-gray-500 mt-1">Leave blank for no expiration</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700">Usage Limit</label>
                    <input
                      type="number"
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. 100"
                      value={newCode.usageLimit || ""}
                      min={1}
                      onChange={e => setNewCode(c => ({ ...c, usageLimit: e.target.value ? Number(e.target.value) : undefined }))}
                    />
                    <div className="text-xs text-gray-500 mt-1">Max total uses for this code</div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1 text-gray-700">Restrict to Email</label>
                    <input
                      type="email"
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="customer@example.com (optional)"
                      value={newCode.allowedEmail || ""}
                      onChange={e => setNewCode(c => ({ ...c, allowedEmail: e.target.value }))}
                      maxLength={100}
                    />
                    <div className="text-xs text-gray-500 mt-1">Restrict code to a specific customer email</div>
                  </div>
                </div>
              </div>


              {formError && <div className="text-red-600 text-xs mt-2">{formError}</div>}
              <div className="flex flex-col sm:flex-row gap-2 justify-end mt-3">
                {editingId && (
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium transition"
                    onClick={() => { setNewCode({ ...DEFAULT_NEW }); setEditingId(null); setFormError(""); }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition disabled:opacity-60"
                  onClick={handleSave}
                  disabled={saving || !newCode.code || !newCode.value}
                >
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Add Code')}
                </button>
              </div>
              {msg && <div className="text-center text-green-700 font-medium text-xs mt-2">{msg}</div>}
          </div>
        </div>
        {/* Promo Codes List */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">All Promo Codes</h2>
          
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {codes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No promo codes found.</p>
                <p className="text-xs text-gray-400 mt-1">Add your first promo code above.</p>
              </div>
            ) : codes.map(code => (
              <div key={code.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{code.code}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {code.type === "percent" ? `${code.value}%` : `$${code.value}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {code.active ? (
                      <span className="text-green-700 text-xs font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 text-xs font-medium">Inactive</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Type:</span> {code.type === "percent" ? "% Off" : "$ Off"}
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span> {code.expiresAt ? new Date(code.expiresAt.seconds * 1000).toLocaleDateString() : "Never"}
                  </div>
                  <div>
                    <span className="font-medium">Usage:</span> {code.usageLimit ? `${code.usedCount || 0}/${code.usageLimit}` : `${code.usedCount || 0} uses`}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    {code.usedCount && code.usedCount > 0 ? (
                      <span className="text-green-700 ml-1">Used</span>
                    ) : (
                      <span className="text-gray-600 ml-1">Unused</span>
                    )}
                  </div>
                </div>
                
                {code.allowedEmail && (
                  <div className="text-xs text-gray-600 mb-3">
                    <span className="font-medium">Restricted to:</span> {code.allowedEmail}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition"
                    onClick={() => handleEdit(code)}
                  >
                    Edit
                  </button>
                  <button
                    className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition"
                    onClick={() => handleDelete(code.id!)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Code</th>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Type</th>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Value</th>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Expires</th>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Usage</th>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Status</th>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Active</th>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Allowed Email</th>
                  <th className="px-3 py-2 border text-left text-xs font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400">No promo codes found.</td></tr>
                ) : codes.map(code => (
                  <tr key={code.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 border font-medium">{code.code}</td>
                    <td className="px-3 py-2 border">{code.type === "percent" ? "% Off" : "$ Off"}</td>
                    <td className="px-3 py-2 border">{code.type === "percent" ? `${code.value}%` : `$${code.value}`}</td>
                    <td className="px-3 py-2 border">{code.expiresAt ? new Date(code.expiresAt.seconds * 1000).toLocaleDateString() : "-"}</td>
                    <td className="px-3 py-2 border">
                      {code.usageLimit ? (
                        <span className="font-medium">{code.usedCount || 0} / {code.usageLimit}</span>
                      ) : (
                        <span>{code.usedCount || 0} uses</span>
                      )}
                    </td>
                    <td className="px-3 py-2 border">
                      {code.usedCount && code.usedCount > 0 ? (
                        <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">Used</span>
                      ) : (
                        <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">Unused</span>
                      )}
                    </td>
                    <td className="px-3 py-2 border">{code.active ? <span className="text-green-700 font-medium">Yes</span> : <span className="text-red-600 font-medium">No</span>}</td>
                    <td className="px-3 py-2 border">{code.allowedEmail || "-"}</td>
                    <td className="px-3 py-2 border">
                      <div className="flex gap-1">
                        <button
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition"
                          onClick={() => handleEdit(code)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition"
                          onClick={() => handleDelete(code.id!)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromoCodesPage() {
  return (
    <AdminLayout>
      <PromoCodesContent />
    </AdminLayout>
  );
} 