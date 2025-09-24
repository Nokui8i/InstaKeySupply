"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface Logo {
  src: string;
  alt: string;
}

interface LogoCarouselProps {
  logos: Logo[];
  autoScroll?: boolean;
  speed?: number;
  className?: string;
}

export default function LogoCarousel({ 
  logos, 
  autoScroll = true, 
  speed = 30, 
  className = "" 
}: LogoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;

    let animationId: number;
    let currentTranslateX = 0;
    let lastTime = 0;

    const scroll = (currentTime: number) => {
      if (currentTime - lastTime >= 16) { // ~60fps, only update every 16ms
        currentTranslateX -= 1; // Slower, smoother movement
        
        // Reset when we've scrolled through one set of logos
        if (Math.abs(currentTranslateX) >= (logos.length * 120)) {
          currentTranslateX = 0;
        }
        
        setTranslateX(currentTranslateX);
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(scroll);
    };

    // Use requestAnimationFrame for better performance
    animationId = requestAnimationFrame(scroll);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [autoScroll, speed, logos.length]);



  if (!logos || logos.length === 0) {
    return null;
  }

  return (
         <div className={`relative overflow-hidden bg-gradient-to-r from-gray-50 to-white py-6 sm:py-8 ${className}`}>
       {/* Gradient overlays for smooth fade effect */}
       <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
       <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-6">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 mb-2">
            Trusted by Leading Automotive Brands
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">
            Premium car keys and remotes for all major manufacturers
          </p>
        </div>
        
                 <div 
           ref={scrollRef}
           className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 lg:space-x-12"
           style={{ 
             transform: `translate3d(${translateX}px, 0, 0)`,
             willChange: 'transform',
             touchAction: 'none',
             userSelect: 'none'
           }}
         >
                      {/* Duplicate logos for seamless infinite scroll */}
            {[...logos, ...logos, ...logos].map((logo, index) => (
            <div 
              key={`${logo.alt}-${index}`}
              className="flex-shrink-0 flex items-center justify-center"
            >
              <div className="relative group">
                                 <Image
                   src={logo.src}
                   alt={logo.alt}
                   width={120}
                   height={60}
                   className="object-contain h-10 sm:h-12 md:h-14 lg:h-16 w-auto opacity-80 hover:opacity-100 transition-all duration-300 transform hover:scale-110 active:scale-95"
                   priority={index < 10} // Prioritize first 10 logos
                 />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-gray-100 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add this CSS to your globals.css for hidden scrollbars
// .scrollbar-hide {
//   -ms-overflow-style: none;
//   scrollbar-width: none;
// }
// .scrollbar-hide::-webkit-scrollbar {
//   display: none;
// }
