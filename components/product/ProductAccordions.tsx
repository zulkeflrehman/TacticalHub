'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldCheck, Ruler, Truck } from 'lucide-react';

interface ProductAccordionsProps {
  product: {
    description: string;
    categoryName: string;
    vendor: string;
  };
}

export default function ProductAccordions({ product }: ProductAccordionsProps) {
  const [openSection, setOpenSection] = useState<'SPECS' | 'DURABILITY' | 'SHIPPING' | null>('SPECS');

  const toggleSection = (section: 'SPECS' | 'DURABILITY' | 'SHIPPING') => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const accordionItems = [
    {
      id: 'SPECS' as const,
      title: 'TECHNICAL SPECIFICATIONS',
      icon: ShieldCheck,
      content: (
        <div className="space-y-3 text-xs text-[#FFFFFF] font-mono">
          <p className="leading-relaxed font-sans text-[#A0B1C5]">{product.description || 'Military-grade high endurance tactical gear designed for field ops.'}</p>
          <table className="w-full text-left border-collapse border border-[#33506B] rounded-none my-2">
            <thead>
              <tr className="bg-[#142230] text-[10px] text-[#FFFFFF] uppercase border-b border-[#33506B]">
                <th className="p-2.5 border-r border-[#33506B]">SPECIFICATION</th>
                <th className="p-2.5 border-r border-[#33506B]">VALUE</th>
                <th className="p-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#1F3346] border-b border-[#33506B]">
                <td className="p-2.5 border-r border-[#33506B] text-[#A0B1C5]">CATEGORY</td>
                <td className="p-2.5 border-r border-[#33506B] font-bold text-[#FFFFFF]">{product.categoryName || 'MIL-SPEC'}</td>
                <td className="p-2.5 text-[#10B981] font-bold">VERIFIED</td>
              </tr>
              <tr className="bg-[#142230] border-b border-[#33506B]">
                <td className="p-2.5 border-r border-[#33506B] text-[#A0B1C5]">BUILD VENDOR</td>
                <td className="p-2.5 border-r border-[#33506B] font-bold text-[#FFFFFF]">{product.vendor || 'TACTICAL HUB'}</td>
                <td className="p-2.5 text-[#10B981] font-bold">AUTHENTIC</td>
              </tr>
              <tr className="bg-[#1F3346] border-b border-[#33506B]">
                <td className="p-2.5 border-r border-[#33506B] text-[#A0B1C5]">WATER RATING</td>
                <td className="p-2.5 border-r border-[#33506B] font-bold text-[#FFFFFF]">IP68 WATERPROOF</td>
                <td className="p-2.5 text-[#FFFFFF] font-bold">MIL-STD-810G</td>
              </tr>
              <tr className="bg-[#142230]">
                <td className="p-2.5 border-r border-[#33506B] text-[#A0B1C5]">WARRANTY</td>
                <td className="p-2.5 border-r border-[#33506B] font-bold text-[#FFFFFF]">1 YEAR LIMITED</td>
                <td className="p-2.5 text-[#10B981] font-bold">COVERED</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'DURABILITY' as const,
      title: 'DURABILITY & FIELD NOTES',
      icon: Ruler,
      content: (
        <div className="space-y-3 text-xs font-mono text-[#A0B1C5]">
          <p className="leading-relaxed font-sans">
            Tested in extreme environmental conditions including high humidity, impact stress, and tactical field deployments.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-[#142230] p-2.5 border border-[#33506B] rounded-none">
              <span className="text-[9px] text-[#A0B1C5] block uppercase font-bold">IMPACT RATING</span>
              <span className="font-bold text-[#FFFFFF] uppercase">MIL-STD-810G</span>
            </div>
            <div className="bg-[#142230] p-2.5 border border-[#33506B] rounded-none">
              <span className="text-[9px] text-[#A0B1C5] block uppercase font-bold">TEMP TOLERANCE</span>
              <span className="font-bold text-[#FFFFFF] uppercase">-20°C TO +65°C</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'SHIPPING' as const,
      title: 'SHIPPING & DELIVERY',
      icon: Truck,
      content: (
        <div className="space-y-3 text-xs font-mono text-[#A0B1C5]">
          <div className="flex items-center gap-2 p-3 bg-[#142230] border border-[#33506B] text-xs font-mono text-[#10B981] font-bold rounded-none">
            <Truck className="w-4 h-4 shrink-0" />
            <span>NATIONWIDE EXPRESS SHIPPING (2-4 BUSINESS DAYS)</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-[#142230] p-2.5 border border-[#33506B] rounded-none">
              <span className="text-[9px] text-[#A0B1C5] block uppercase font-bold mb-1">CASH ON DELIVERY</span>
              <span className="font-bold text-[#FFFFFF] text-xs">Available across all major cities in Pakistan</span>
            </div>
            <div className="bg-[#142230] p-2.5 border border-[#33506B] rounded-none">
              <span className="text-[9px] text-[#A0B1C5] block uppercase font-bold mb-1">RETURNS</span>
              <span className="font-bold text-[#FFFFFF] text-xs">7-day return policy on unopened items</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 my-6">
      {accordionItems.map((item) => {
        const Icon = item.icon;
        const isOpen = openSection === item.id;

        return (
          <div key={item.id} className="bg-[#1F3346] border border-[#33506B] rounded-none overflow-hidden">
            <button
              onClick={() => toggleSection(item.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#142230] transition-colors rounded-none"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-[#FFFFFF]" />
                <span className="text-xs font-mono font-black uppercase text-[#FFFFFF] tracking-wider">
                  {item.title}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#A0B1C5] transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-[#FFFFFF]' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4 border-t border-[#33506B]"
                >
                  <div className="pt-3">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
