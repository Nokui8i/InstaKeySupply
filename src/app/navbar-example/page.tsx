'use client';

import React, { useState } from 'react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  HeartIcon,
  ShoppingBagIcon,
  GlobeAltIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function NavbarExample() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Navbar Example */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
                         {/* Logo Section */}
             <div className="flex items-center space-x-4">
                             {/* Logo */}
               <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                   <Image 
                     src="/Untitled design logo try.png" 
                     alt="InstaKey Logo" 
                     width={32} 
                     height={32}
                     className="w-full h-full object-cover"
                   />
                 </div>
                 <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                   InstaKey
                 </span>
               </div>

                             {/* Desktop Navigation - Removed for cleaner look */}
            </div>

            {/* Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="Search for keys, remotes..."
                />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              
              {/* Vehicle Selector */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200/50"
                >
                  <GlobeAltIcon className="h-4 w-4" />
                  <span>Vehicle</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                
                {/* Vehicle Dropdown */}
                {isVehicleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200/50 backdrop-blur-xl">
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                          <option>Make</option>
                          <option>Toyota</option>
                          <option>Honda</option>
                          <option>Ford</option>
                        </select>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                          <option>Model</option>
                          <option>Camry</option>
                          <option>Corolla</option>
                        </select>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                          <option>Year</option>
                          <option>2024</option>
                          <option>2023</option>
                        </select>
                        <button className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          Go
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Icons */}
              <div className="flex items-center space-x-3">
                {/* Account */}
                <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 group">
                  <UserIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                </button>

                {/* Wishlist */}
                <button className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-200 group relative">
                  <HeartIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* Cart */}
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group relative">
                  <ShoppingBagIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    1
                  </span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="Search for keys, remotes..."
              />
            </div>
          </div>
        </div>

                 {/* Mobile Menu */}
         {isMenuOpen && (
           <div className="md:hidden bg-white border-t border-gray-200/50">
             <div className="px-4 py-4 space-y-3">
               {/* Navigation links removed for cleaner look */}
              
              {/* Mobile Vehicle Selector */}
              <div className="pt-3 border-t border-gray-200/50">
                <div className="grid grid-cols-3 gap-2">
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Make</option>
                    <option>Toyota</option>
                    <option>Honda</option>
                    <option>Ford</option>
                  </select>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Model</option>
                    <option>Camry</option>
                    <option>Corolla</option>
                  </select>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Year</option>
                    <option>2024</option>
                    <option>2023</option>
                  </select>
                </div>
                <button className="w-full mt-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Find Compatible Keys
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Content to demonstrate the navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Beautiful Navbar Example
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            This demonstrates how to make your navbar look modern and professional
          </p>
          
          {/* Design Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Glassmorphism</h3>
              <p className="text-gray-600 text-sm">Backdrop blur effects and transparent backgrounds</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smooth Animations</h3>
              <p className="text-gray-600 text-sm">Hover effects and micro-interactions</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsive Design</h3>
              <p className="text-gray-600 text-sm">Works perfectly on all device sizes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
