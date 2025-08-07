"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AdminLayout from '../layout';
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

function EmailTemplatesContent() {
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
      <div className="bg-gray-50 border border-gray-200 rounded p-3 sm:p-4 text-xs whitespace-pre-wrap mt-2">
        <div className="font-medium mb-1">Subject: {template.subject}</div>
        <div dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br/>') }} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2">
            Manage email templates for order confirmation and shipping notifications
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-3 sm:p-6">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-2 gap-2 sm:gap-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Confirmation Email</h2>
                <button
                  onClick={() => sendTestEmail('orderPlaced')}
                  disabled={sendingTest.orderPlaced}
                  className="group px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="flex items-center gap-1.5">
                    {sendingTest.orderPlaced ? (
                      <>
                        <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Test Email
                      </>
                    )}
                  </span>
                </button>
              </div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-2 py-1.5 sm:px-2 sm:py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                value={templates.orderPlaced.subject}
                onChange={e => setTemplates(t => ({ ...t, orderPlaced: { ...t.orderPlaced, subject: e.target.value } }))}
              />
              <label className="block text-xs font-medium text-gray-700 mb-1">Body</label>
              <textarea
                className="w-full border border-gray-300 rounded px-2 py-1.5 sm:px-2 sm:py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px] sm:min-h-[200px]"
                value={templates.orderPlaced.body}
                onChange={e => setTemplates(t => ({ ...t, orderPlaced: { ...t.orderPlaced, body: e.target.value } }))}
              />
              <div className="text-xs text-gray-500 mt-1">Placeholders: {'{customerName}'}, {'{orderItems}'}, {'{shippingAddress}'}, {'{orderTotal}'}</div>
              <div className="mt-3 sm:mt-2 font-medium text-xs text-gray-700">Preview:</div>
              {renderPreview(templates.orderPlaced)}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-2 gap-2 sm:gap-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Shipped Email</h2>
                <button
                  onClick={() => sendTestEmail('orderShipped')}
                  disabled={sendingTest.orderShipped}
                  className="group px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="flex items-center gap-1.5">
                    {sendingTest.orderShipped ? (
                      <>
                        <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Test Email
                      </>
                    )}
                  </span>
                </button>
              </div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-2 py-1.5 sm:px-2 sm:py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                value={templates.orderShipped.subject}
                onChange={e => setTemplates(t => ({ ...t, orderShipped: { ...t.orderShipped, subject: e.target.value } }))}
              />
              <label className="block text-xs font-medium text-gray-700 mb-1">Body</label>
              <textarea
                className="w-full border border-gray-300 rounded px-2 py-1.5 sm:px-2 sm:py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px] sm:min-h-[200px]"
                value={templates.orderShipped.body}
                onChange={e => setTemplates(t => ({ ...t, orderShipped: { ...t.orderShipped, body: e.target.value } }))}
              />
              <div className="text-xs text-gray-500 mt-1">Placeholders: {'{customerName}'}, {'{orderItems}'}, {'{shippingAddress}'}, {'{orderTotal}'}, {'{trackingNumber}'}</div>
              <div className="mt-3 sm:mt-2 font-medium text-xs text-gray-700">Preview:</div>
              {renderPreview(templates.orderShipped)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-6 border-t border-gray-200">
            <button
              className="group relative px-6 py-3 sm:px-8 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={resetTemplates}
              disabled={resettingTemplates}
            >
              <span className="flex items-center justify-center gap-2">
                {resettingTemplates ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset to Defaults
                  </>
                )}
              </span>
            </button>
            <button
              className="group relative px-6 py-3 sm:px-8 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={handleSave}
              disabled={saving}
            >
              <span className="flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Templates
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Status Message */}
          {msg && (
            <div className="text-center text-green-700 font-medium text-sm mt-4 p-3 bg-green-50 border border-green-200 rounded">
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  return (
    <AdminLayout>
      <EmailTemplatesContent />
    </AdminLayout>
  );
} 