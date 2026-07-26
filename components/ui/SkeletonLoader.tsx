'use client';

import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] clip-angled p-3 flex flex-col space-y-3 relative overflow-hidden">
      {/* Image box placeholder */}
      <div className="w-full aspect-square skeleton-shimmer clip-angled-sm" />
      
      {/* Category badge placeholder */}
      <div className="w-16 h-3 skeleton-shimmer" />
      
      {/* Title placeholder */}
      <div className="w-3/4 h-4 skeleton-shimmer" />
      
      {/* Price & button placeholder */}
      <div className="flex items-center justify-between pt-2">
        <div className="w-16 h-5 skeleton-shimmer" />
        <div className="w-20 h-8 skeleton-shimmer clip-angled-sm" />
      </div>
    </div>
  );
}

export function HeroShowcaseSkeleton() {
  return (
    <div className="w-full h-[460px] bg-[#121212] border border-[#2A2A2A] clip-angled-lg p-6 relative overflow-hidden flex flex-col justify-between">
      <div className="space-y-4 max-w-md">
        <div className="w-36 h-6 skeleton-shimmer clip-angled-sm" />
        <div className="w-full h-12 skeleton-shimmer" />
        <div className="w-2/3 h-12 skeleton-shimmer" />
        <div className="w-4/5 h-4 skeleton-shimmer" />
      </div>
      <div className="flex gap-4 pt-4">
        <div className="w-36 h-12 skeleton-shimmer clip-angled-sm" />
        <div className="w-32 h-12 skeleton-shimmer clip-angled-sm" />
      </div>
    </div>
  );
}

export function PDPGallerySkeleton() {
  return (
    <div className="w-full h-[60vh] min-h-[380px] bg-[#161616] border-b border-[#2A2A2A] relative overflow-hidden flex items-center justify-center">
      <div className="w-48 h-48 rounded-full skeleton-shimmer opacity-50" />
    </div>
  );
}
