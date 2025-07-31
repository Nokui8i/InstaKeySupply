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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Collapsible Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 w-56 h-full bg-gradient-to-b from-blue-50 to-blue-100 text-blue-900 flex flex-col py-4 px-3 space-y-3 transform transition-transform duration-300 ease-in-out border-r border-blue-200 shadow-lg
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close Button */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 text-blue-700 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-200 transition-colors"
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
        
        <nav className="space-y-2">
          <Link href="/admin" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <HomeIcon className="w-5 h-5 mr-3" />
            Dashboard
          </Link>

          <Link href="/admin/categories" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/categories' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <FolderIcon className="w-5 h-5 mr-3" />
            Categories
          </Link>
          <Link href="/admin/inventory" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/inventory' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <ArchiveBoxIcon className="w-5 h-5 mr-3" />
            Inventory
          </Link>
          <Link href="/admin/orders" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/orders' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <ShoppingCartIcon className="w-5 h-5 mr-3" />
            Orders
          </Link>
          <Link href="/admin/banners" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/banners' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <PhotoIcon className="w-5 h-5 mr-3" />
            Banners
          </Link>
          <Link href="/admin/promo-codes" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/promo-codes' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <TagIcon className="w-5 h-5 mr-3" />
            Promo Codes
          </Link>
          <Link href="/admin/vehicle-compatibility" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/vehicle-compatibility' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <TruckIcon className="w-5 h-5 mr-3" />
            Vehicle Compatibility
          </Link>
          <Link href="/admin/email-subscribers" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/email-subscribers' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <EnvelopeIcon className="w-5 h-5 mr-3" />
            Email Subscribers
          </Link>
          <Link href="/admin/email-campaigns" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/email-campaigns' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <MegaphoneIcon className="w-5 h-5 mr-3" />
            Email Campaigns
          </Link>
          <Link href="/admin/email-templates" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/email-templates' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <DocumentTextIcon className="w-5 h-5 mr-3" />
            Email Templates
          </Link>
          <Link href="/admin/site-content" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/site-content' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3" />
            Site Content
          </Link>
          <Link href="/admin/contact-messages" className={`flex items-center px-4 py-2 rounded-lg transition-colors ${pathname === '/admin/contact-messages' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
            <InboxIcon className="w-5 h-5 mr-3" />
            Contact Messages
          </Link>
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
      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-56' : 'ml-0'}`}>
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
      <AdminSidebarProvider>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </AdminSidebarProvider>
    </AdminAuthProvider>
  );
} 