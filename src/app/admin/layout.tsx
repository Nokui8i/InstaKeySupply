"use client";
import React from "react";
import { useAdminAuth } from "./context/AdminAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { AdminSidebarProvider, useAdminSidebar } from "./context/AdminSidebarContext";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { HomeIcon, FolderIcon, ArchiveBoxIcon, ShoppingCartIcon, PhotoIcon, TagIcon, TruckIcon, EnvelopeIcon, MegaphoneIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, InboxIcon } from "@heroicons/react/24/outline";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAdminSidebar();
  const { isAuthenticated, isLoading, logout, user } = useAdminAuth();

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
    <div className="flex h-screen bg-gray-50">
      {/* Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          style={{ zIndex: 999998 }}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ zIndex: 999999 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-500">Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex flex-col h-full">
          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">Admin User</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Management
            </h3>
            <nav className="space-y-1">
              <Link href="/admin" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <HomeIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>

              <Link href="/admin/categories" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/categories' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <FolderIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Categories</span>
              </Link>
              <Link href="/admin/inventory" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/inventory' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <ArchiveBoxIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Inventory</span>
              </Link>
              <Link href="/admin/orders" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <ShoppingCartIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Orders</span>
              </Link>
              <Link href="/admin/banners" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/banners' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <PhotoIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Banners</span>
              </Link>
              <Link href="/admin/promo-codes" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/promo-codes' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <TagIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Promo Codes</span>
              </Link>
              <Link href="/admin/vehicle-compatibility" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/vehicle-compatibility' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <TruckIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Vehicle Compatibility</span>
              </Link>
              <Link href="/admin/email-subscribers" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/email-subscribers' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <EnvelopeIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Email Subscribers</span>
              </Link>
              <Link href="/admin/email-campaigns" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/email-campaigns' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <MegaphoneIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Email Campaigns</span>
              </Link>
              <Link href="/admin/email-templates" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/email-templates' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <DocumentTextIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Email Templates</span>
              </Link>
              <Link href="/admin/site-content" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/site-content' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Site Content</span>
              </Link>
              <Link href="/admin/contact-messages" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/contact-messages' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <InboxIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Contact Messages</span>
              </Link>
            </nav>
          </div>
          
          {/* Logout Section - Always at bottom */}
          <div className="p-4 border-t border-gray-100 mt-auto">
            <button 
              onClick={logout} 
              className="w-full flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
        <main className="flex-1 overflow-auto pt-2 sm:pt-6 transition-all duration-500">
          {children}
        </main>
        
        {/* Session Timeout Warning */}
        <SessionTimeoutWarning />
      </div>
    </div>
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