'use client';
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [terms, setTerms] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getDoc(doc(db, 'siteContent', 'terms'))
      .then(snap => {
        if (snap.exists()) {
          setTerms(snap.data().text || snap.data().content || '');
        } else {
          setTerms('No Terms & Conditions found.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load Terms & Conditions.');
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in overflow-y-auto max-h-[80vh]">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200">×</button>
        <h2 className="text-lg font-bold mb-4 text-blue-700">Terms &amp; Conditions</h2>
        <div className="text-xs text-gray-700 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-sans text-xs">{terms}</pre>
          )}
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