"use client";
import React, { useState, useEffect } from "react";
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PromoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dontShow, setDontShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState({
    enabled: true,
    headline: 'UNLOCK',
    subheadline: '10% OFF',
    description: 'Get 10% OFF your next order when you sign up to receive email and text messages with discounts, offers and new product announcements. Some exclusions apply.',
    buttonText: 'CONTINUE',
    disclaimer: 'Unsubscribing is as easy as texting "STOP", but please give us a try. We promise not to send text messages too frequently, and only when we have truly valuable info for you.'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      try {
        const promoRef = doc(db, 'siteContent', 'promoModal');
        const promoSnap = await getDoc(promoRef);
        let data = promoSnap.exists() ? promoSnap.data() : {};
        setContent({
          enabled: data.enabled ?? true,
          headline: data.headline ?? 'UNLOCK',
          subheadline: data.subheadline ?? '10% OFF',
          description: data.description ?? 'Get 10% OFF your next order when you sign up to receive email and text messages with discounts, offers and new product announcements. Some exclusions apply.',
          buttonText: data.buttonText ?? 'CONTINUE',
          disclaimer: data.disclaimer ?? 'Unsubscribing is as easy as texting "STOP", but please give us a try. We promise not to send text messages too frequently, and only when we have truly valuable info for you.'
        });
      } catch {
        setContent({
          enabled: true,
          headline: 'UNLOCK',
          subheadline: '10% OFF',
          description: 'Get 10% OFF your next order when you sign up to receive email and text messages with discounts, offers and new product announcements. Some exclusions apply.',
          buttonText: 'CONTINUE',
          disclaimer: 'Unsubscribing is as easy as texting "STOP", but please give us a try. We promise not to send text messages too frequently, and only when we have truly valuable info for you.'
        });
      }
      setLoading(false);
    }
    if (open) fetchContent();
  }, [open]);

  useEffect(() => {
    if (open) {
      setEmail("");
      setPhone("");
      setSubmitted(false);
      setError(null);
      setDontShow(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!phone || !/^\+?\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      setError("Please enter a valid phone number.");
      return;
    }
    
    setError(null);
    setSubmitted(true);
    
    try {
      // Send to our API for storage
      const response = await fetch('/api/collect-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          phone: phone,
          source: 'promo_modal'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to collect email');
      }

      // Store dismissal preference
      localStorage.setItem("promoModalDismissed", "true");
      
      // Close modal after success
      setTimeout(onClose, 2000);
      
    } catch (error) {
      console.error('Error collecting email:', error);
      setError("Failed to collect your information. Please try again.");
      setSubmitted(false);
    }
  };

  const handleClose = () => {
    if (dontShow) {
      localStorage.setItem("promoModalDismissed", "true");
    }
    onClose();
  };

  if (!open || loading || !content.enabled) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in overflow-y-auto max-h-[90vh] flex flex-col items-center">
        <button onClick={handleClose} className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200">×</button>
        <h2 className="text-center text-blue-700 font-extrabold text-2xl mb-1 tracking-wide">{content.headline}</h2>
        <h3 className="text-center text-3xl font-extrabold text-blue-900 mb-2">{content.subheadline}</h3>
        <p className="text-center text-gray-600 text-sm mb-4">{content.description}</p>
        {submitted ? (
          <div className="text-center text-green-600 font-semibold py-8">Thank you!</div>
        ) : (
          <form className="w-full flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              type="email"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="tel"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
              placeholder="Cell Phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            {error && <div className="text-red-500 text-xs text-center">{error}</div>}
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-2 rounded-lg transition-all duration-200 shadow-md mt-2"
            >
              {content.buttonText}
            </button>
            <div className="flex items-center mt-2">
              <input
                id="dontShow"
                type="checkbox"
                checked={dontShow}
                onChange={e => setDontShow(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="dontShow" className="text-xs text-gray-500 cursor-pointer">Do not show this to me again</label>
            </div>
          </form>
        )}
        <p className="text-[11px] text-gray-400 text-center mt-4">{content.disclaimer}</p>
        <div className="flex justify-center mt-4">
          <img src="/Untitled design.png" alt="InstaKey Logo" className="h-24 object-contain" />
        </div>
      </div>
      <style jsx global>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
} 