'use client';

import React from 'react';
import { ShieldCheck, Droplets, Compass, Layers, Lock, Cpu } from 'lucide-react';

interface EditorialSpecSheetProps {
  product: {
    vendor: string;
    categoryName: string;
    description: string;
  };
}

export default function EditorialSpecSheet({ product }: EditorialSpecSheetProps) {
  const specBadges = [
    { icon: Droplets, label: 'IP68 WATERPROOF', value: '100% Sealed Canopy / Casing' },
    { icon: ShieldCheck, label: 'MILITARY SPEC', value: '1000D Nylon & Titanium Frame' },
    { icon: Layers, label: 'MOLLE WEBBING', value: 'Modular Tactical Attachment System' },
    { icon: Lock, label: 'HAPTIC LOCK', value: 'Spring Loaded Instant Engagement' },
    { icon: Compass, label: 'TERRAIN TESTED', value: 'Passed All-Weather Mountain Deploy' },
    { icon: Cpu, label: 'AUTHENTIC VENDOR', value: product.vendor || 'Tacticalhub Official' },
  ];

  return (
    <div className="bento-card bento-card-lg p-6 space-y-4 my-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-xs font-mono font-bold text-[#FFFFFF] uppercase tracking-widest">
          EDITORIAL SPECIFICATION SHEET
        </span>
        <span className="text-[10px] font-mono text-[#B8EC44] bg-[#B8EC44]/10 border border-[#B8EC44]/30 px-2.5 py-0.5 rounded-full font-bold">
          VERIFIED ASSET
        </span>
      </div>

      {/* Grid of Minimalist Icon Spec Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {specBadges.map((spec, i) => {
          const Icon = spec.icon;
          return (
            <div key={i} className="bg-[#1F3346] border border-white/10 p-3.5 rounded-xl space-y-1">
              <Icon className="w-4 h-4 text-[#FFFFFF]" />
              <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block pt-1">
                {spec.label}
              </span>
              <span className="text-xs font-extrabold text-white uppercase block truncate">
                {spec.value}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-neutral-300 font-sans leading-relaxed pt-2 border-t border-white/10">
        {product.description || 'Crafted with premium materials matching official military specifications.'}
      </p>
    </div>
  );
}
