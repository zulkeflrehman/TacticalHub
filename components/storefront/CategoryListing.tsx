'use client';

import { useState, useMemo } from 'react';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import { SlidersHorizontal, ArrowUpDown, X, Filter } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  vendor: string;
  categoryName: string;
  images: { url: string }[];
  variants: { sku: string; name: string; price: number; compareAtPrice: number | null; stock: number }[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  stock: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface CategoryListingProps {
  category: Category;
  initialProducts: Product[];
}

export default function CategoryListing({ category, initialProducts }: CategoryListingProps) {
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOption, setSortOption] = useState('latest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract unique vendors for filter sidebar
  const allVendors = useMemo(() => {
    const vendors = new Set<string>();
    initialProducts.forEach(p => {
      if (p.vendor) vendors.add(p.vendor);
    });
    return Array.from(vendors);
  }, [initialProducts]);

  const handleVendorToggle = (vendor: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendor)
        ? prev.filter(v => v !== vendor)
        : [...prev, vendor]
    );
  };

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedVendors([]);
    setInStockOnly(false);
    setSortOption('latest');
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by Min Price
    if (minPrice !== '') {
      result = result.filter(p => p.price >= minPrice);
    }
    // Filter by Max Price
    if (maxPrice !== '') {
      result = result.filter(p => p.price <= maxPrice);
    }
    // Filter by Vendor
    if (selectedVendors.length > 0) {
      result = result.filter(p => selectedVendors.includes(p.vendor));
    }
    // Filter by Stock
    if (inStockOnly) {
      result = result.filter(p => p.stock > 0);
    }

    // Sort
    if (sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [initialProducts, minPrice, maxPrice, selectedVendors, inStockOnly, sortOption]);

  const sidebarFilters = (
    <div className="space-y-6">
      {/* Brand/Vendor Filter */}
      {allVendors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-brand-black border-l-2 border-brand-accent pl-2">
            Filter by Brand
          </h4>
          <div className="space-y-2">
            {allVendors.map(vendor => (
              <label key={vendor} className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(vendor)}
                  onChange={() => handleVendorToggle(vendor)}
                  className="accent-brand-accent w-4 h-4 rounded-none border-brand-black/10 focus:ring-0 focus:outline-none"
                />
                <span>{vendor}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Filter */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-brand-black border-l-2 border-brand-accent pl-2">
          Price Range (PKR)
        </h4>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold text-brand-black focus:outline-none focus:border-brand-black"
          />
          <span className="text-brand-dark-gray text-xs font-bold">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold text-brand-black focus:outline-none focus:border-brand-black"
          />
        </div>
      </div>

      {/* Availability Filter */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-brand-black border-l-2 border-brand-accent pl-2">
          Availability
        </h4>
        <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={e => setInStockOnly(e.target.checked)}
            className="accent-brand-accent w-4 h-4"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Reset Action */}
      <button
        onClick={handleResetFilters}
        className="w-full text-center py-2.5 border border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white text-xs font-bold uppercase transition-colors clip-angled"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Breadcrumbs & Title */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-brand-dark-gray/60 uppercase tracking-widest flex items-center gap-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-brand-black">Collections</span>
          <span>/</span>
          <span className="text-brand-black">{category.name}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
          {category.name}
        </h1>
        <p className="text-xs sm:text-sm text-brand-dark-gray font-medium max-w-2xl leading-relaxed">
          {category.description || `Browse our elite selection of high-performance ${category.name.toLowerCase()}.`}
        </p>
      </div>

      {/* Toolbar Controls */}
      <div className="flex items-center justify-between py-3 px-4 border border-brand-black/5 bg-brand-white clip-angled">
        <div className="flex items-center gap-4 text-xs font-semibold text-brand-dark-gray">
          <span>Products: <strong className="text-brand-black font-extrabold">{filteredProducts.length}</strong></span>
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 hover:text-brand-black transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-black">
          <ArrowUpDown className="w-3.5 h-3.5 text-brand-dark-gray" />
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="bg-transparent font-bold focus:outline-none cursor-pointer text-xs"
          >
            <option value="latest">New Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Alphabetical: A-Z</option>
            <option value="name-desc">Alphabetical: Z-A</option>
          </select>
        </div>
      </div>

      {/* Main Listing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters (Desktop Only) */}
        <aside className="hidden lg:block bg-brand-white border border-brand-black/5 p-6 clip-angled">
          {sidebarFilters}
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-brand-white border border-brand-black/5 py-16 px-4 text-center rounded-none clip-angled">
              <SlidersHorizontal className="w-12 h-12 text-brand-dark-gray/30 mx-auto stroke-[1.5] mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">No matching products found</h3>
              <p className="text-xs text-brand-dark-gray mt-1 max-w-sm mx-auto">
                Try widening your price range, toggling other brands, or clearing active filters to browse all inventory.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 border border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white text-xs font-bold uppercase py-2.5 px-6 transition-colors clip-angled"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-brand-white shadow-2xl z-50 flex flex-col animate-slide-left">
            <div className="p-4 border-b border-brand-black/5 flex items-center justify-between bg-brand-black text-brand-white">
              <span className="font-extrabold uppercase text-xs tracking-wider">Filters</span>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-brand-white/80 hover:text-brand-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {sidebarFilters}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
