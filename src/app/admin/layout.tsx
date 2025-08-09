"use client";
import React from "react";
import { useAdminAuth } from "./context/AdminAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { AdminSidebarProvider, useAdminSidebar } from "./context/AdminSidebarContext";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";
import AdminSidebar from "./components/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAdminSidebar();
  const { isAuthenticated, isLoading } = useAdminAuth();

  // Set up global event listener for admin sidebar toggle
  React.useEffect(() => {
    const handleAdminSidebarToggle = () => {
      console.log('Admin sidebar toggle event received');
      toggleSidebar();
    };

    window.addEventListener('admin-sidebar-toggle', handleAdminSidebarToggle);
    return () => {
      window.removeEventListener('admin-sidebar-toggle', handleAdminSidebarToggle);
    };
  }, [toggleSidebar]);

  // Update global admin sidebar state when it changes
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('admin-sidebar-state-change', { 
      detail: { sidebarOpen } 
    }));
  }, [sidebarOpen]);

  // Allow login page to render without layout/auth checks
  if (typeof window !== 'undefined' && window.location.pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the admin panel.</p>
          <a 
            href="/admin/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Admin Sidebar - Rendered outside flex container for true overlay */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex h-screen bg-gray-50">
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
          <main className="flex-1 overflow-auto pt-2 sm:pt-6 transition-all duration-500">
            {children}
          </main>
          
          {/* Session Timeout Warning */}
          <SessionTimeoutWarning />
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider>
      <AdminSidebarProvider>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </AdminSidebarProvider>
    </AdminAuthProvider>
  );
} 