"use client";
import React, { useState } from "react";
import { useAdminAuth } from "./context/AdminAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, logout, user } = useAdminAuth();

  // Allow login page to render without layout/auth checks
  if (pathname === '/admin/login') {
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <aside className={`
        fixed lg:fixed top-0 left-0 z-50 w-56 lg:w-48 h-full bg-gradient-to-b from-blue-50 to-blue-100 text-blue-900 flex flex-col py-4 px-3 space-y-3 transform transition-transform duration-300 ease-in-out border-r border-blue-200 shadow-lg
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-3 right-3 text-blue-700 hover:text-blue-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-xl font-bold mb-4 tracking-wide text-blue-800">Admin</div>
        
        {/* User Info */}
        {user && (
          <div className="mb-4 p-2 bg-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-medium truncate">{user.email}</p>
            <p className="text-xs text-blue-600">Admin User</p>
          </div>
        )}
        
        <nav className="flex flex-col gap-1">
          <a 
            href="/admin" 
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Dashboard
          </a>
          <a 
            href="/admin/inventory" 
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Inventory
          </a>
          <a
            href="/admin/orders"
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Orders
          </a>
          <a
            href="/admin/email-templates"
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Email Templates
          </a>
          <a
            href="/admin/promo-codes"
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Promo Codes
          </a>
          <a
            href="/admin/site-content"
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Site Content
          </a>
          <a
            href="/admin/contact-messages"
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Contact Messages
          </a>
          <a 
            href="/admin/banners" 
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Banners
          </a>
          <a 
            href="/admin/vehicle-compatibility" 
            className="hover:bg-blue-200 rounded px-2 py-1.5 transition-colors text-blue-800 hover:text-blue-900 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            Vehicle Compatibility
          </a>
        </nav>
        <div className="pt-3 border-t border-blue-300">
          <button 
            onClick={logout} 
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1.5 px-2 rounded transition-colors cursor-pointer text-xs"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content - Separate from sidebar */}
      <div className="lg:ml-48">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 sm:p-8">
          {children}
        </main>
      </div>
      
      {/* Session Timeout Warning */}
      <SessionTimeoutWarning />
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminAuthProvider>
  );
} 