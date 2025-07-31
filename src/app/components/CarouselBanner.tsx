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
  if (!images || images.length === 0) return null;
  const [current, setCurrent] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const total = images.length;

  // Auto-advance every 10 seconds
  useEffect(() => {
    if (isTransitioning) return;
    const timer = setTimeout(() => {
      handleNext();
    }, 10000);
    return () => clearTimeout(timer);
  }, [current, isTransitioning, total]);

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
        {/* Arrows - Mobile optimized */}
        <button
          onClick={handlePrev}
          className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white text-xl sm:text-2xl md:text-4xl font-bold p-1.5 sm:p-2 md:p-3 rounded-full hover:bg-black/50 transition z-30 min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Previous banner"
        >
          {'<'}
        </button>
        <button
          onClick={handleNext}
          className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white text-xl sm:text-2xl md:text-4xl font-bold p-1.5 sm:p-2 md:p-3 rounded-full hover:bg-black/50 transition z-30 min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Next banner"
        >
          {'>'}
        </button>
        {/* Dots - Mobile optimized */}
        <div className="absolute bottom-1 sm:bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2 md:gap-3 z-40">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDot(i)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white shadow transition-all duration-200 touch-manipulation ${i === current ? "bg-blue-400" : "bg-white/60 hover:bg-white/80"}`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 