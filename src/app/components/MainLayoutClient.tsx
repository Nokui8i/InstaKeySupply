"use client";
import React, { useState, useEffect } from "react";
import NavBar from "./NavBar";



interface MainLayoutClientProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export default function MainLayoutClient({ children, sidebarOpen, onSidebarToggle }: MainLayoutClientProps) {
  const [vehicleFilters, setVehicleFilters] = useState<{
    make: string;
    model: string;
    yearRange: string;
  } | null>(null);
  


  // Handle responsive sidebar behavior - removed auto-open on desktop
  useEffect(() => {
    const handleResize = () => {
      // Keep sidebar state as is, don't auto-open on desktop
      // User can manually toggle it
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleVehicleFiltersChange = (event: CustomEvent) => {
      setVehicleFilters(event.detail);
    };

    const handleClearVehicleFilters = () => {
      setVehicleFilters(null);
    };

    window.addEventListener('vehicle-filters-change', handleVehicleFiltersChange as EventListener);
    window.addEventListener('clear-vehicle-filters', handleClearVehicleFilters);

    return () => {
      window.removeEventListener('vehicle-filters-change', handleVehicleFiltersChange as EventListener);
      window.removeEventListener('clear-vehicle-filters', handleClearVehicleFilters);
    };
  }, []);

  const handleSidebarToggle = () => {
    console.log('Sidebar toggle clicked, current state:', sidebarOpen);
    onSidebarToggle();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
        <NavBar 
          onVehicleFiltersChange={(filters) => {
            setVehicleFilters(filters);
            window.dispatchEvent(new CustomEvent('vehicle-filters-change', { detail: filters }));
          }}
          onClearVehicleFilters={() => {
            setVehicleFilters(null);
            window.dispatchEvent(new CustomEvent('clear-vehicle-filters'));
          }}
          onSidebarToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-auto pt-2 sm:pt-6 transition-all duration-500">
          {children}
        </main>
      </div>
    </div>
  );
} 