'use client';
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './components/AuthContext';
import { CartProvider } from './components/CartContext';
import MainLayoutClient from './components/MainLayoutClient';
import Footer from './components/Footer';
import TermsModal from './components/TermsModal';
import PrivacyModal from './components/PrivacyModal';
import Sidebar from './components/Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const showTerms = () => setShowTerms(true);
    const showPrivacy = () => setShowPrivacy(true);
    const handleSidebarToggle = () => setSidebarOpen(prev => !prev);
    
    window.addEventListener('show-terms', showTerms);
    window.addEventListener('show-privacy', showPrivacy);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('show-terms', showTerms);
      window.removeEventListener('show-privacy', showPrivacy);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <MainLayoutClient sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(prev => !prev)}>
          {children}
          <Footer onShowTerms={() => setShowTerms(true)} onShowPrivacy={() => setShowPrivacy(true)} />
        </MainLayoutClient>
        
        {/* Sidebar rendered at root level to avoid stacking context issues */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
        <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
      </CartProvider>
    </AuthProvider>
  );
} 