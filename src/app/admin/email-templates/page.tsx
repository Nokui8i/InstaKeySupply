"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
  const [sendingTest, setSendingTest] = useState({ orderPlaced: false, orderShipped: false });
  const [resettingTemplates, setResettingTemplates] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    async function fetchTemplates() {
      const ref = doc(db, "siteContent", "emailTemplates");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setTemplates({ ...DEFAULTS, ...snap.data() });
      }
      setLoading(false);
    }
    fetchTemplates();
  }, [isAuthenticated]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "emailTemplates"), { ...templates });
      setMsg("Templates saved!");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Failed to save templates.");
      setTimeout(() => setMsg(""), 2000);
    }
    setSaving(false);
  };

  const sendTestEmail = async (type: 'orderPlaced' | 'orderShipped') => {
    setSendingTest(prev => ({ ...prev, [type]: true }));
    try {
      const testData = {
        customer: {
          name: "Test Customer",
          email: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com', // Send to admin email
          phone: "+1 (555) 123-4567"
        },
        address: {
          street: "123 Test Street",
          city: "Test City",
          state: "TS",
          zip: "12345",
          country: "United States"
        },
        items: [
          {
            title: "Test Product - Toyota Camry Key",
            quantity: 1,
            price: 89.99
          },
          {
            title: "Test Product - Honda Accord Key",
            quantity: 2,
            price: 79.95
          }
        ],
        total: 249.89,
        trackingNumber: type === 'orderShipped' ? "1Z999AA1234567890" : undefined
      };

      const endpoint = type === 'orderPlaced' ? '/api/send-order-email' : '/api/send-shipped-email';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        setMsg(`Test ${type === 'orderPlaced' ? 'order confirmation' : 'shipping notification'} email sent!`);
      } else {
        setMsg(`Failed to send test email: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Test email error:', error);
      setMsg('Failed to send test email. Check console for details.');
    }
    setSendingTest(prev => ({ ...prev, [type]: false }));
    setTimeout(() => setMsg(""), 3000);
  };

  const resetTemplates = async () => {
    setResettingTemplates(true);
    try {
      await setDoc(doc(db, "siteContent", "emailTemplates"), DEFAULTS);
      setTemplates(DEFAULTS);
      setMsg("Templates reset to defaults!");
      setTimeout(() => setMsg(""), 2000);
    } catch (error) {
      console.error('Reset templates error:', error);
      setMsg('Failed to reset templates. Check console for details.');
    }
    setResettingTemplates(false);
  };

  const exampleOrder = {
    customerName: "Omri Amar",
    orderItems: "Test Product x 1 - $10.00",
    shippingAddress: "6445 W Sunset Rd #168\nLas Vegas, NV 89118, United States",
    orderTotal: "10.00",
    trackingNumber: "Tracking Number: 1234567890",
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
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <div className="text-center py-12 text-red-600">Access denied. Admins only.</div>;
  }

    return (
    <>
      <h1 className="text-2xl font-bold mb-8 text-blue-900">Email Templates</h1>
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border border-blue-100 p-6 flex flex-col gap-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-blue-700">Order Confirmation Email</h2>
            <button
              onClick={() => sendTestEmail('orderPlaced')}
              disabled={sendingTest.orderPlaced}
              className="px-4 py-1 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
            >
              {sendingTest.orderPlaced ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
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
          <div className="text-xs text-gray-500 mt-1">Placeholders: {'{customerName}'}, {'{orderItems}'}, {'{shippingAddress}'}, {'{orderTotal}'}</div>
          <div className="mt-2 font-semibold text-xs text-gray-700">Preview:</div>
          {renderPreview(templates.orderPlaced)}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-blue-700">Order Shipped Email</h2>
            <button
              onClick={() => sendTestEmail('orderShipped')}
              disabled={sendingTest.orderShipped}
              className="px-4 py-1 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
            >
              {sendingTest.orderShipped ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
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
          <div className="text-xs text-gray-500 mt-1">Placeholders: {'{customerName}'}, {'{orderItems}'}, {'{shippingAddress}'}, {'{orderTotal}'}, {'{trackingNumber}'}</div>
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
        <button
          className="self-end px-8 py-2 bg-red-600 text-white rounded-full font-bold shadow hover:bg-red-700 transition disabled:opacity-60"
          onClick={resetTemplates}
          disabled={resettingTemplates}
        >
          {resettingTemplates ? 'Resetting...' : 'Reset Templates to Defaults'}
        </button>
        {msg && <div className="text-center text-green-700 font-semibold text-sm mt-2">{msg}</div>}
      </div>
    </>
  );
} 