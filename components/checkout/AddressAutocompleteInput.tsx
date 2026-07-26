'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Check, AlertCircle } from 'lucide-react';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export default function AddressAutocompleteInput({ value, onChange, error }: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [isShake, setIsShake] = useState(false);

  // Simulated Google Maps API Autocomplete predictions for Pakistan addresses
  const sampleAddresses = [
    'Main Boulevard, Gulberg III, Lahore',
    'DHA Phase 5, Sector C, Lahore',
    'Clifton Block 4, Karachi',
    'F-7 Markaz, Jinnah Avenue, Islamabad',
    'Saddar Cantt, Rawalpindi',
    'University Road, Peshawar',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (val.trim().length > 2) {
      const matches = sampleAddresses.filter((addr) =>
        addr.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(matches);
      setIsValid(val.trim().length > 6);
    } else {
      setSuggestions([]);
      setIsValid(false);
    }
  };

  const handleSelect = (addr: string) => {
    onChange(addr);
    setSuggestions([]);
    setIsValid(true);
  };

  const handleBlur = () => {
    if (value.trim().length > 0 && value.trim().length < 6) {
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
    }
  };

  return (
    <div className="relative space-y-1">
      <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
        DELIVERY ADDRESS (PREDICTIVE AUTOCOMPLETE)
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="Start typing your street address..."
          className={`w-full bg-[#121212] text-white py-3 pl-10 pr-10 text-xs font-mono border clip-angled transition-all focus:outline-none ${
            isShake || error
              ? 'border-[#EF4444] animate-shake shadow-[0_0_10px_rgba(239,68,68,0.4)]'
              : isValid
              ? 'border-[#10B981] animate-pulse-green'
              : 'border-[#2A2A2A] focus:border-[#FF6600]'
          }`}
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF6600]" />

        {isValid ? (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981]" />
        ) : error ? (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EF4444]" />
        ) : null}
      </div>

      {/* Autocomplete Predictions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1A1A1A] border border-[#FF6600]/40 clip-angled shadow-2xl overflow-hidden divide-y divide-[#2A2A2A]">
          {suggestions.map((addr) => (
            <div
              key={addr}
              onClick={() => handleSelect(addr)}
              className="p-3 text-xs font-mono text-neutral-300 hover:text-white hover:bg-[#2A2A2A] cursor-pointer flex items-center gap-2 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF6600] shrink-0" />
              <span>{addr}</span>
            </div>
          ))}
        </div>
      )}

      {/* Validation Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-mono text-[#EF4444] font-bold flex items-center gap-1 pt-0.5"
        >
          <AlertCircle className="w-3 h-3" /> {error}
        </motion.p>
      )}
    </div>
  );
}
