'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listCategories, listPublishedProducts } from '@/lib/client-services';
import type { CategoryDto, ProductDto } from '@/lib/catalog-types';
import HeroCinematic from '@/components/home/HeroCinematic';
import BentoGridCategories from '@/components/home/BentoGridCategories';
import FluidCarousel from '@/components/home/FluidCarousel';
import ProductCard from '@/components/product/ProductCard';
import { HeroShowcaseSkeleton, ProductCardSkeleton } from '@/components/ui/SkeletonLoader';
import { ShieldCheck, Compass, Anchor, Target, Package, ArrowRight, Filter } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'featured' | 'new' | 'bestseller'>('all');

  useEffect(() => {
    Promise.all([listPublishedProducts(), listCategories()])
      .then(([catalog, categoryList]) => {
        setProducts(catalog);
        setCategories(categoryList);
      })
      .catch(() => setError('The live tactical catalog could not be loaded. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  const newArrivals = products.filter((p) => p.isNewArrival);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const featuredItems = products.filter((p) => p.isFeatured);

  const filteredProducts =
    activeFilter === 'featured' ? featuredItems.length > 0 ? featuredItems : products :
    activeFilter === 'new' ? newArrivals.length > 0 ? newArrivals : products :
    activeFilter === 'bestseller' ? bestSellers.length > 0 ? bestSellers : products :
    products;

  const FILTERS = [
    { key: 'all', label: 'ALL' },
    { key: 'featured', label: 'FEATURED' },
    { key: 'new', label: 'NEW ARRIVALS' },
    { key: 'bestseller', label: 'BEST SELLERS' },
  ] as const;

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Hero Cinematic Section */}
      {loading ? (
        <HeroShowcaseSkeleton />
      ) : (
        <HeroCinematic featuredProducts={featuredItems.length > 0 ? featuredItems : products} />
      )}

      {/* Feature Badges Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 py-2">
        {[
          { icon: ShieldCheck, title: "MILITARY SPEC", desc: "Extreme outdoor durability" },
          { icon: Compass, title: "TERRAIN READY", desc: "Tested in rugged environments" },
          { icon: Target, title: "SELF DEFENSE", desc: "Tactical batons & tasers" },
          { icon: Anchor, title: "COD NATIONWIDE", desc: "Pay on receipt across Pakistan" },
        ].map((f, i) => (
          <div key={i} className="bento-card flex gap-3 items-center p-4">
            <f.icon className="w-5 h-5 text-[#FFFFFF] shrink-0" />
            <div>
              <h4 className="text-xs font-mono font-black uppercase text-white">{f.title}</h4>
              <p className="text-[10px] text-neutral-400 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ─── ALL PRODUCTS SECTION ─────────────────────────────────── */}
      <section id="products" className="scroll-mt-20">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-[#33506B]">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-[#FFFFFF]" />
            <div>
              <span className="text-[10px] font-mono font-bold text-[#A0B1C5] uppercase tracking-widest block mb-0.5">
                STORE CATALOGUE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-none flex items-center gap-2">
                <Package className="w-6 h-6 shrink-0" />
                ALL PRODUCTS
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[#A0B1C5]">
              <Filter className="w-3 h-3" /> FILTER
            </span>
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#FFFFFF] hover:text-[#F4F1E8] uppercase tracking-wider transition-colors border border-[#33506B] px-3 py-1.5 hover:border-[#FFFFFF]"
            >
              View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 flex-wrap mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1.5 transition-all rounded-none border ${
                activeFilter === f.key
                  ? 'bg-[#FFFFFF] text-[#142230] border-[#FFFFFF]'
                  : 'bg-transparent text-[#A0B1C5] border-[#33506B] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
              }`}
            >
              {f.label}
              {f.key !== 'all' && !loading && (
                <span className={`ml-1.5 ${activeFilter === f.key ? 'text-[#142230]' : 'text-[#33506B]'}`}>
                  ({f.key === 'featured' ? featuredItems.length : f.key === 'new' ? newArrivals.length : bestSellers.length})
                </span>
              )}
            </button>
          ))}
          {!loading && (
            <span className="ml-auto text-[10px] font-mono text-[#A0B1C5] self-center">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bento-card p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-[#33506B] mx-auto" />
            <p className="text-sm font-mono font-bold text-[#A0B1C5] uppercase">No products found</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-[11px] font-mono text-[#FFFFFF] border border-[#33506B] px-4 py-2 hover:border-[#FFFFFF] transition-colors"
            >
              Show All Products
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 h-11 px-8 bg-[#FFFFFF] text-[#142230] hover:bg-[#F4F1E8] font-mono text-xs font-black uppercase tracking-wider transition-all rounded-none border border-[#FFFFFF] active:scale-[0.98]"
            >
              Browse Full Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>
      {/* ─────────────────────────────────────────────────────────── */}

      {/* Editorial Bento Box Categories */}
      <BentoGridCategories categories={categories} />

      {error && (
        <div className="bento-card border-red-500/40 bg-red-950/20 p-4 text-center text-xs font-mono font-bold text-red-400">
          {error}
        </div>
      )}

      {/* Trending Best Sellers Fluid Carousel */}
      {!loading && (
        <FluidCarousel
          title="TRENDING BEST SELLERS"
          categorySlug="camping-tents"
          products={bestSellers.length > 0 ? bestSellers : products}
        />
      )}

      {/* Editorial Promo Sales Banner */}
      <section className="bento-card bento-card-lg bg-gradient-to-r from-[#2F4F2F]/60 via-[#1F3346] to-[#FFFFFF]/20 border border-[#B8EC44]/30 text-white p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-mono font-bold text-[#B8EC44] uppercase tracking-widest block">
            VERIFIED DISCOUNT SYSTEM
          </span>
          <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
            ENTER PROMO CODES AT CHECKOUT
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Every promotional coupon is verified against live inventory rules, min spend, and usage caps.
          </p>
        </div>
        <Link
          href="/products"
          className="bg-[#FFFFFF] text-black hover:bg-[#F4F1E8] text-xs font-mono font-black uppercase py-4 px-8 rounded-none transition-colors shrink-0 active:scale-[0.98]"
        >
          SHOP ALL PRODUCTS
        </Link>
      </section>

      {/* New Tactical Arrivals Fluid Carousel */}
      {!loading && (
        <FluidCarousel
          title="NEW RECON ARRIVALS"
          categorySlug="knives-tasers"
          products={newArrivals.length > 0 ? newArrivals : products}
        />
      )}
    </div>
  );
}
