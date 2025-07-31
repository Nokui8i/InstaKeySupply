"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from "firebase/firestore";

import { useAdminAuth } from "../context/AdminAuthContext";

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

export default function PromoCodesPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newCode, setNewCode] = useState<PromoCode>({ ...DEFAULT_NEW });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    async function fetchCodes() {
      const q = query(collection(db, "promoCodes"), orderBy("code"));
      const snap = await getDocs(q);
      setCodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode)));
      setLoading(false);
    }
    fetchCodes();
  }, [isAuthenticated]);

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

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <div className="text-center py-12 text-red-600">Access denied. Admins only.</div>;
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Promo Codes</h1>
      <div className="max-w-4xl bg-white rounded-xl shadow border border-blue-100 p-6 flex flex-col gap-8 ml-72">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-blue-700 flex items-center gap-2">
            {editingId ? "Edit Promo Code" : "Add Promo Code"}
            {newCode.active ? (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full ml-2">Active</span>
            ) : (
              <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full ml-2">Inactive</span>
            )}
          </h2>
          <div className="flex flex-col gap-4">
            {/* Required Fields - Promo Code Basics */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-bold text-blue-800 mb-3">Promo Code Details</h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. SUMMER20"
                    value={newCode.code}
                    onChange={e => setNewCode(c => ({ ...c, code: e.target.value.toUpperCase() }))}
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Type <span className="text-red-500">*</span></label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newCode.type}
                    onChange={e => setNewCode(c => ({ ...c, type: e.target.value as "percent" | "fixed" }))}
                  >
                    <option value="percent">% Off</option>
                    <option value="fixed">$ Off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Value <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newCode.value}
                    min={1}
                    onChange={e => setNewCode(c => ({ ...c, value: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Optional Fields - Restrictions & Settings */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Optional Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Expiration Date</label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newCode.expiresAt ? new Date(newCode.expiresAt.seconds * 1000).toISOString().slice(0, 10) : ""}
                    onChange={e => setNewCode(c => ({ ...c, expiresAt: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null }))}
                  />
                  <div className="text-xs text-gray-500 mt-1">Leave blank for no expiration</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Usage Limit</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 100"
                    value={newCode.usageLimit || ""}
                    min={1}
                    onChange={e => setNewCode(c => ({ ...c, usageLimit: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                  <div className="text-xs text-gray-500 mt-1">Max total uses for this code</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Restrict to Email</label>
                  <input
                    type="email"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="customer@example.com (optional)"
                    value={newCode.allowedEmail || ""}
                    onChange={e => setNewCode(c => ({ ...c, allowedEmail: e.target.value }))}
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 mt-1">Restrict code to a specific customer email</div>
                </div>
              </div>
            </div>


            {formError && <div className="text-red-600 text-xs mt-1">{formError}</div>}
            <div className="flex gap-2 justify-end mt-2">
              {editingId && (
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold shadow transition"
                  onClick={() => { setNewCode({ ...DEFAULT_NEW }); setEditingId(null); setFormError(""); }}
                >
                  Cancel
                </button>
              )}
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
                onClick={handleSave}
                disabled={saving || !newCode.code || !newCode.value}
              >
                {saving ? 'Saving...' : (editingId ? 'Update Promo Code' : 'Add Promo Code')}
              </button>
            </div>
            {msg && <div className="text-center text-green-700 font-semibold text-sm mt-2">{msg}</div>}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 text-blue-700">All Promo Codes</h2>
          <table className="w-full border text-xs md:text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-2 py-1 border">Code</th>
                <th className="px-2 py-1 border">Type</th>
                <th className="px-2 py-1 border">Value</th>
                <th className="px-2 py-1 border">Expires</th>
                <th className="px-2 py-1 border">Usage</th>
                <th className="px-2 py-1 border">Status</th>
                <th className="px-2 py-1 border">Active</th>
                <th className="px-2 py-1 border">Allowed Email</th>
                <th className="px-2 py-1 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-6 text-gray-400">No promo codes found.</td></tr>
              ) : codes.map(code => (
                <tr key={code.id} className="border-t">
                  <td className="px-2 py-1 border font-bold">{code.code}</td>
                  <td className="px-2 py-1 border">{code.type === "percent" ? "% Off" : "$ Off"}</td>
                  <td className="px-2 py-1 border">{code.type === "percent" ? `${code.value}%` : `$${code.value}`}</td>
                  <td className="px-2 py-1 border">{code.expiresAt ? new Date(code.expiresAt.seconds * 1000).toLocaleDateString() : "-"}</td>
                  <td className="px-2 py-1 border">
                    {code.usageLimit ? (
                      <div className="flex flex-col">
                        <span className="font-semibold">{code.usedCount || 0} / {code.usageLimit}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span>{code.usedCount || 0} uses</span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1 border">
                    {code.usedCount && code.usedCount > 0 ? (
                      <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">USED</span>
                    ) : (
                      <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">UNUSED</span>
                    )}
                  </td>
                  <td className="px-2 py-1 border">{code.active ? <span className="text-green-700 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}</td>
                  <td className="px-2 py-1 border">{code.allowedEmail || "-"}</td>
                  <td className="px-2 py-1 border">
                    <button
                      className="px-2 py-1 bg-blue-200 hover:bg-blue-300 text-blue-900 text-xs font-semibold rounded transition mr-1"
                      onClick={() => handleEdit(code)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 bg-red-200 hover:bg-red-300 text-red-900 text-xs font-semibold rounded transition"
                      onClick={() => handleDelete(code.id!)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
} 