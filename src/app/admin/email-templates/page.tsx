"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Dropzone from "react-dropzone";
import AdminLayout from "../layout";
import { useAdminAuth } from "../context/AdminAuthContext";

const DEFAULTS = {
  orderPlaced: {
    subject: "Thank you for your order!",
    body: `Hi {customerName},\n\nThank you for your order! Here is your order summary:\n\nOrder Items:\n{orderItems}\n\nShipping To:\n{shippingAddress}\n\nTotal: ${'{orderTotal}'}\n\nWe appreciate your business! If you have any questions, reply to this email.\n\nBest regards,\nInstaKey Supply Team`,
  },
  orderShipped: {
    subject: "Your order has shipped!",
    body: `Hi {customerName},\n\nGood news! Your order has shipped and is on its way.\n\nOrder Items:\n{orderItems}\n\nShipping To:\n{shippingAddress}\n\nTotal: ${'{orderTotal}'}\n{trackingNumber}\n\nThank you for shopping with us!\n\nBest regards,\nInstaKey Supply Team`,
  },
};

export default function EmailTemplatesPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [templates, setTemplates] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    async function fetchTemplates() {
      const ref = doc(db, "siteContent", "emailTemplates");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setTemplates({ ...DEFAULTS, ...snap.data() });
        if (snap.data().logoUrl) setLogoUrl(snap.data().logoUrl);
      }
      setLoading(false);
    }
    fetchTemplates();
  }, [isAuthenticated]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "emailTemplates"), { ...templates, logoUrl });
      setMsg("Templates saved!");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Failed to save templates.");
      setTimeout(() => setMsg(""), 2000);
    }
    setSaving(false);
  };

  const handleLogoDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    setUploadingLogo(true);
    const file = acceptedFiles[0];
    const storage = getStorage();
    const fileRef = storageRef(storage, `email-logos/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    setLogoUrl(url);
    setUploadingLogo(false);
    setMsg("Logo uploaded!");
    setTimeout(() => setMsg(""), 2000);
  };

  const exampleOrder = {
    customerName: "Omri Amar",
    orderItems: "Test Product x 1 - $10.00",
    shippingAddress: "6445 W Sunset Rd #168\nLas Vegas, NV 89118, United States",
    orderTotal: "10.00",
    trackingNumber: "Tracking Number: 1234567890",
    logo: logoUrl ? `<img src='${logoUrl}' alt='Logo' style='max-width:180px; margin-bottom:16px;' />` : "",
  };

  function renderPreview(template: { subject: string; body: string }) {
    let body = template.body;
    Object.entries(exampleOrder).forEach(([k, v]) => {
      body = body.replaceAll(`{${k}}`, v);
    });
    // Render as HTML for logo preview
    return (
      <div className="bg-gray-50 border rounded p-4 text-xs whitespace-pre-wrap mt-2">
        <div className="font-bold mb-1">Subject: {template.subject}</div>
        <div dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br/>') }} />
      </div>
    );
  }

  if (isLoading) {
    return <AdminLayout><div className="text-center py-12 text-gray-500">Loading...</div></AdminLayout>;
  }
  if (!isAuthenticated) {
    return <AdminLayout><div className="text-center py-12 text-red-600">Access denied. Admins only.</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8 text-blue-900">Email Templates</h1>
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border border-blue-100 p-6 flex flex-col gap-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2 text-blue-700">Logo for Emails</h2>
          <Dropzone onDrop={handleLogoDrop} accept={{ 'image/*': [] }} multiple={false}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()} className="border-2 border-dashed border-blue-300 rounded p-4 text-center cursor-pointer bg-blue-50 hover:bg-blue-100 transition mb-2">
                <input {...getInputProps()} />
                {uploadingLogo ? (
                  <span className="text-blue-600">Uploading...</span>
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="mx-auto mb-2 max-h-24" />
                ) : (
                  <span className="text-gray-500">Drag & drop or click to upload a logo image</span>
                )}
              </div>
            )}
          </Dropzone>
          <div className="text-xs text-gray-500">Use the <code>{'{logo}'}</code> placeholder in your email template to insert the logo.</div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 text-blue-700">Order Confirmation Email</h2>
          <label className="block text-xs font-semibold mb-1">Subject</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 mb-2"
            value={templates.orderPlaced.subject}
            onChange={e => setTemplates(t => ({ ...t, orderPlaced: { ...t.orderPlaced, subject: e.target.value } }))}
          />
          <label className="block text-xs font-semibold mb-1">Body</label>
          <textarea
            className="w-full border rounded px-2 py-1 min-h-[200px] text-sm"
            value={templates.orderPlaced.body}
            onChange={e => setTemplates(t => ({ ...t, orderPlaced: { ...t.orderPlaced, body: e.target.value } }))}
          />
          <div className="text-xs text-gray-500 mt-1">Placeholders: {'{logo}'}, {'{customerName}'}, {'{orderItems}'}, {'{shippingAddress}'}, {'{orderTotal}'}</div>
          <div className="mt-2 font-semibold text-xs text-gray-700">Preview:</div>
          {renderPreview(templates.orderPlaced)}
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 text-blue-700">Order Shipped Email</h2>
          <label className="block text-xs font-semibold mb-1">Subject</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 mb-2"
            value={templates.orderShipped.subject}
            onChange={e => setTemplates(t => ({ ...t, orderShipped: { ...t.orderShipped, subject: e.target.value } }))}
          />
          <label className="block text-xs font-semibold mb-1">Body</label>
          <textarea
            className="w-full border rounded px-2 py-1 min-h-[200px] text-sm"
            value={templates.orderShipped.body}
            onChange={e => setTemplates(t => ({ ...t, orderShipped: { ...t.orderShipped, body: e.target.value } }))}
          />
          <div className="text-xs text-gray-500 mt-1">Placeholders: {'{logo}'}, {'{customerName}'}, {'{orderItems}'}, {'{shippingAddress}'}, {'{orderTotal}'}, {'{trackingNumber}'}</div>
          <div className="mt-2 font-semibold text-xs text-gray-700">Preview:</div>
          {renderPreview(templates.orderShipped)}
        </div>
        <button
          className="self-end px-8 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Templates'}
        </button>
        {msg && <div className="text-center text-green-700 font-semibold text-sm mt-2">{msg}</div>}
      </div>
    </AdminLayout>
  );
} 