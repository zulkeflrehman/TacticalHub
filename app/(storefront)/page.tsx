'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listCategories, listPublishedProducts } from '@/lib/client-services';
import type { CategoryDto, ProductDto } from '@/lib/catalog-types';
import ProductCard from '@/components/product/ProductCard';
import { ShieldCheck, Compass, Anchor, Target, ArrowRight } from 'lucide-react';

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
      .catch(() => setError('The live catalog could not be loaded. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  const newArrivals = products.filter((product) => product.isNewArrival);
  const bestSellers = products.filter((product) => product.isBestSeller);

  return (
    <div className="space-y-16">
      
      {/* Hero Section */}
      <section className="relative w-full bg-brand-black text-brand-white p-8 md:p-16 flex flex-col justify-center min-h-[500px] clip-angled-lg overflow-hidden group">
        <div className="absolute inset-0 bg-cover bg-center opacity-30 select-none pointer-events-none" style={{ backgroundImage: "url('https://tacticalhub.com.pk/cdn/shop/files/Untitled_design_3.jpg')" }}></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-accent/10 skew-x-12 transform origin-top-right transition-transform group-hover:scale-105 pointer-events-none select-none"></div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 border border-brand-accent/30 bg-brand-accent/5 py-1 px-3 text-brand-accent text-xs font-bold uppercase tracking-widest clip-angled-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tactical Deployment Gear</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none">
            GEAR UP FOR <br />
            THE <span className="text-brand-accent">UNKNOWN</span>
          </h1>
          <p className="text-sm md:text-base text-brand-white/80 font-medium leading-relaxed">
            Professional military batons, self-defense tasers, robust all-weather camping tents, and tactical accessories. Sourced to deliver extreme durability under harsh outdoor conditions.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link 
              href="/categories?slug=camping-tents"
              className="bg-brand-accent text-brand-black hover:bg-brand-accent-hover text-xs font-extrabold uppercase py-4 px-8 transition-colors clip-angled flex items-center gap-1"
            >
              <span>Explore Tents</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/categories?slug=knives-tasers"
              className="border border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black text-xs font-extrabold uppercase py-4 px-8 transition-colors clip-angled"
            >
              Self-Defense Shop
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Badges Showcase */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-b border-brand-black/5">
        {[
          { icon: ShieldCheck, title: "Military Grade", desc: "Sourced for absolute durability" },
          { icon: Compass, title: "Outdoor Ready", desc: "Designed for extreme terrains" },
          { icon: Target, title: "Self Defense", desc: "Personal safety tasers & batons" },
          { icon: Anchor, title: "COD Nationwide", desc: "Pay on receipt across Pakistan" },
        ].map((f, i) => (
          <div key={i} className="flex gap-3 items-start p-4 bg-brand-white border border-brand-black/5 clip-angled-sm">
            <f.icon className="w-6 h-6 text-brand-accent shrink-0 stroke-[2]" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-brand-black">{f.title}</h4>
              <p className="text-[10px] font-semibold text-brand-dark-gray/60 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories Cards */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-widest border-l-4 border-brand-accent pl-3 text-brand-black">
            Featured Categories
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((c) => (
            <Link 
              key={c.slug} 
              href={`/categories?slug=${encodeURIComponent(c.slug)}`}
              className="group bg-brand-black text-brand-white overflow-hidden aspect-[4/3] relative flex flex-col justify-end p-6 clip-angled border border-brand-black hover:border-brand-accent transition-standard"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                style={{ backgroundImage: `url('${c.image || 'https://tacticalhub.com.pk/cdn/shop/files/Untitled_design_3.jpg'}')` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/30 to-transparent"></div>
              
              <div className="relative z-10 space-y-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest group-hover:text-brand-accent transition-colors">
                  {c.name}
                </h3>
                <span className="text-[9px] font-bold text-brand-accent hover:underline flex items-center gap-0.5">
                  Explore Gear <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo Sales Banner */}
      <section className="bg-brand-accent text-brand-black p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 clip-angled-lg">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
            CHECK CURRENT STORE PROMOTIONS
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-brand-black/80 leading-relaxed">
            Enter a promotion code at checkout. Every code, validity window, usage limit, minimum order, and discount is verified against the live store rules.
          </p>
        </div>
        <Link 
          href="/categories?slug=camping-tents"
          className="bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black text-xs font-black uppercase py-4 px-8 transition-colors shrink-0 clip-angled border border-brand-black"
        >
          Gear Up Now
        </Link>
      </section>

      {loading && <p className="text-center text-xs font-bold uppercase text-brand-dark-gray">Loading live inventory...</p>}
      {error && <p className="border border-red-200 bg-red-50 p-4 text-center text-xs font-bold text-red-700">{error}</p>}

      {/* Trending (Best Sellers) */}
      <section className="space-y-6">
        <h2 className="text-lg md:text-xl font-black uppercase tracking-widest border-l-4 border-brand-accent pl-3 text-brand-black">
          Trending Best Sellers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bestSellers.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="space-y-6">
        <h2 className="text-lg md:text-xl font-black uppercase tracking-widest border-l-4 border-brand-accent pl-3 text-brand-black">
          New Tactical Arrivals
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newArrivals.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

    </div>
  );
}
