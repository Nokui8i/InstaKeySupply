"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon,
  HomeIcon, 
  FolderIcon, 
  ArchiveBoxIcon, 
  ShoppingCartIcon, 
  PhotoIcon, 
  TagIcon, 
  TruckIcon, 
  EnvelopeIcon, 
  MegaphoneIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  InboxIcon
} from '@heroicons/react/24/outline';
import { useAdminAuth } from '../context/AdminAuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  // Use portal to render at document body level for true overlay
  if (typeof window === 'undefined') return null;

  const sidebarContent = (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999998]"
          style={{ zIndex: 9999998 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-72 md:w-80 bg-white shadow-2xl z-[9999999] transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ zIndex: 9999999 }}
      >
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
             onClick={onClose}
             className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
             aria-label="Close sidebar"
           >
             <XMarkIcon className="w-6 h-6 text-gray-600" />
           </button>
         </div>

                 {/* Scrollable Content */}
         <div className="flex flex-col h-full">
           {/* Navigation - Scrollable */}
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
             <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
               Management
             </h3>
             <nav className="space-y-1">
               <Link href="/admin" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                 <HomeIcon className="w-5 h-5" />
                 <span className="text-sm font-medium">Dashboard</span>
               </Link>

              <Link href="/admin/categories" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/categories' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <FolderIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Categories</span>
              </Link>
              <Link href="/admin/inventory" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/inventory' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <ArchiveBoxIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Inventory</span>
              </Link>
              <Link href="/admin/orders" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <ShoppingCartIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Orders</span>
              </Link>
              <Link href="/admin/banners" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/banners' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <PhotoIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Banners</span>
              </Link>
              <Link href="/admin/promo-codes" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/promo-codes' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <TagIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Promo Codes</span>
              </Link>
              <Link href="/admin/shipping-costs" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/shipping-costs' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <TruckIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Shipping Costs</span>
              </Link>
              <Link href="/admin/vehicle-compatibility" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/vehicle-compatibility' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <TruckIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Vehicle Compatibility</span>
              </Link>
              <Link href="/admin/email-subscribers" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/email-subscribers' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <EnvelopeIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Email Subscribers</span>
              </Link>
              <Link href="/admin/email-campaigns" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/email-campaigns' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <MegaphoneIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Email Campaigns</span>
              </Link>
              <Link href="/admin/email-templates" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/email-templates' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <DocumentTextIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Email Templates</span>
              </Link>
              <Link href="/admin/site-content" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/site-content' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Site Content</span>
              </Link>
              <Link href="/admin/contact-messages" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/contact-messages' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>
                <InboxIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Contact Messages</span>
              </Link>
            </nav>
          </div>
          
                     {/* Logout Section - Always at bottom */}
           <div className="p-4 border-t border-gray-100 mt-auto">
             <button 
               onClick={logout} 
               className="w-full flex items-center gap-3 p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
               <span className="text-sm font-medium">Logout</span>
             </button>
           </div>
                 </div>
       </div>
     </>
   );

  return createPortal(sidebarContent, document.body);
 }
