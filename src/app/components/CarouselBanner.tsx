"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface BannerImage {
  src: string;
  alt: string;
}

interface CarouselBannerProps {
  images: BannerImage[];
}

export default function CarouselBanner({ images }: CarouselBannerProps) {
  const [current, setCurrent] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  if (!images || images.length === 0) return null;
  
  const total = images.length;

  function handlePrev() {
    if (isTransitioning) return;
    setDirection("left");
    setNextIndex(current === 0 ? total - 1 : current - 1);
    setIsTransitioning(true);
  }
  
  function handleNext() {
    if (isTransitioning) return;
    setDirection("right");
    setNextIndex((current === total - 1 ? 0 : current + 1));
    setIsTransitioning(true);
  }
  
  function handleDot(i: number) {
    if (isTransitioning || i === current) return;
    setDirection(i > current ? "right" : "left");
    setNextIndex(i);
    setIsTransitioning(true);
  }

  // Auto-advance every 10 seconds
  useEffect(() => {
    if (isTransitioning) return;
    const timer = setTimeout(() => {
      handleNext();
    }, 10000);
    return () => clearTimeout(timer);
  }, [current, isTransitioning, total, handleNext]);

  // After animation, update current
  useEffect(() => {
    if (!isTransitioning || nextIndex === null) return;
    const timeout = setTimeout(() => {
      setCurrent(nextIndex);
      setNextIndex(null);
      setIsTransitioning(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [isTransitioning, nextIndex]);

  // Animation classes
  const getClass = (type: "current" | "next") => {
    if (!isTransitioning) return "z-10";
    if (type === "current") {
      return direction === "right"
        ? "animate-carousel-slide-out-left z-10"
        : "animate-carousel-slide-out-right z-10";
    } else {
      return direction === "right"
        ? "animate-carousel-slide-in-right z-20"
        : "animate-carousel-slide-in-left z-20";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative w-full overflow-hidden bg-white/10 rounded-2xl shadow-2xl md:border-2 md:border-blue-400/30">
        {/* Image area */}
        <div className="relative w-full aspect-[16/7] md:aspect-[16/5] h-full">
          {/* Current image */}
          <div className={`absolute top-0 left-0 w-full h-full transition-transform duration-500 ${getClass("current")}`} key={current}>
            <Image
              src={images[current].src}
              alt={images[current].alt}
              fill
              className="object-cover w-full h-full rounded-2xl"
              priority
            />
          </div>
          {/* Next image (only during transition) */}
          {isTransitioning && nextIndex !== null && (
            <div className={`absolute top-0 left-0 w-full h-full transition-transform duration-500 ${getClass("next")}`} key={nextIndex}>
              <Image
                src={images[nextIndex].src}
                alt={images[nextIndex].alt}
                fill
                className="object-cover w-full h-full rounded-2xl"
                priority
              />
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
          aria-label="Next image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDot(i)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                i === current ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 