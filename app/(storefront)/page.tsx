'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listCategories, listPublishedProducts } from '@/lib/client-services';
import type { CategoryDto, ProductDto } from '@/lib/catalog-types';
import HeroCinematic from '@/components/home/HeroCinematic';
import BentoGridCategories from '@/components/home/BentoGridCategories';
import FluidCarousel from '@/components/home/FluidCarousel';
import { HeroShowcaseSkeleton } from '@/components/ui/SkeletonLoader';
import { ShieldCheck, Compass, Anchor, Target } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
