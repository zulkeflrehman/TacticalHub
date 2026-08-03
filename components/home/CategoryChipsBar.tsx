'use client';

import { useState } from 'react';
import type { CategoryDto } from '@/lib/catalog-types';
import Link from 'next/link';
import { LayoutGrid, Flashlight, Backpack, Swords, Smartphone, Shirt, Tent, Shield } from 'lucide-react';

interface CategoryChipsBarProps {
  categories?: CategoryDto[];
  activeSlug?: string;
  onSelectCategory?: (slug: string) => void;
}

const DEFAULT_CATEGORY_PILLS = [
  { name: 'All Gear', slug: 'all', icon: LayoutGrid },
  { name: 'Lighting', slug: 'outdoor-tools', icon: Flashlight },
  { name: 'Backpacks', slug: 'tactical-backpacks', icon: Backpack },
  { name: 'Knives', slug: 'knives-tasers', icon: Swords },
  { name: 'Tactical Tech', slug: 'tasers-baton-sticks', icon: Smartphone },
  { name: 'Apparel', slug: 'apparel-vests', icon: Shirt },
  { name: 'Tents & Shelter', slug: 'camping-tents', icon: Tent },
  { name: 'Self Defense', slug: 'self-defense', icon: Shield },
];

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('tent') || lower.includes('shelter')) return Tent;
  if (lower.includes('knife') || lower.includes('blade')) return Swords;
  if (lower.includes('light') || lower.includes('tool')) return Flashlight;
  if (lower.includes('defense') || lower.includes('baton')) return Shield;
  if (lower.includes('tech') || lower.includes('taser')) return Smartphone;
  if (lower.includes('apparel') || lower.includes('vest')) return Shirt;
  return Backpack;
}

export default function CategoryChipsBar({
  categories = [],
  activeSlug: externalActiveSlug,
  onSelectCategory,
}: CategoryChipsBarProps) {
  const [internalActiveSlug, setInternalActiveSlug] = useState('all');
  const activeSlug = externalActiveSlug !== undefined ? externalActiveSlug : internalActiveSlug;

  const handleSelect = (slug: string) => {
    setInternalActiveSlug(slug);
    if (onSelectCategory) {
      onSelectCategory(slug);
    }
  };

  const chips = categories.length > 0
    ? [
        { name: 'All Gear', slug: 'all', icon: LayoutGrid },
        ...categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          icon: getCategoryIcon(c.name),
        }))
      ]
    : DEFAULT_CATEGORY_PILLS;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 py-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {chips.map((chip) => {
          const Icon = chip.icon;
          const isActive = activeSlug === chip.slug;
          
          const content = (
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{chip.name}</span>
            </div>
          );

          return onSelectCategory ? (
            <button
              key={chip.slug}
              onClick={() => handleSelect(chip.slug)}
              className={`shrink-0 flex items-center h-10 px-4 font-mono text-xs font-bold uppercase transition-all active:scale-[0.98] border rounded-none ${
                isActive
                  ? 'bg-[#FFFFFF] text-[#142230] border-[#FFFFFF] shadow-sm'
                  : 'bg-[#1F3346] text-[#FFFFFF] border-[#33506B] hover:border-[#FFFFFF]'
              }`}
            >
              {content}
            </button>
          ) : (
            <Link
              key={chip.slug}
              href={chip.slug === 'all' ? '/categories' : `/categories?slug=${chip.slug}`}
              className={`shrink-0 flex items-center h-10 px-4 font-mono text-xs font-bold uppercase transition-all active:scale-[0.98] border rounded-none ${
                isActive
                  ? 'bg-[#FFFFFF] text-[#142230] border-[#FFFFFF] shadow-sm'
                  : 'bg-[#1F3346] text-[#FFFFFF] border-[#33506B] hover:border-[#FFFFFF]'
              }`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
