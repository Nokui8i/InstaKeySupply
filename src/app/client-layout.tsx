'use client';
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './components/AuthContext';
import { CartProvider } from './components/CartContext';
import MainLayoutClient from './components/MainLayoutClient';
import Footer from './components/Footer';
import TermsModal from './components/TermsModal';
import PrivacyModal from './components/PrivacyModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    const showTerms = () => setShowTerms(true);
    const showPrivacy = () => setShowPrivacy(true);
    window.addEventListener('show-terms', showTerms);
    window.addEventListener('show-privacy', showPrivacy);
    return () => {
      window.removeEventListener('show-terms', showTerms);
      window.removeEventListener('show-privacy', showPrivacy);
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <MainLayoutClient>
          {children}
          <Footer onShowTerms={() => setShowTerms(true)} onShowPrivacy={() => setShowPrivacy(true)} />
        </MainLayoutClient>
        <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
        <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
      </CartProvider>
    </AuthProvider>
  );
} 