'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductDetails from '@/components/product/ProductDetails';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/SkeletonLoader';
import { listPublishedProducts } from '@/lib/client-services';
import type { ProductDto } from '@/lib/catalog-types';
import { Package, ArrowLeft, Filter, Search } from 'lucide-react';

// ─── Product Detail View (when ?slug= is present) ──────────────────────────
function ProductView({ slug }: { slug: string }) {
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [related, setRelated] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublishedProducts().then((products) => {
      const selected = products.find((entry) => entry.slug === slug) || null;
      setProduct(selected);
      setRelated(
        selected
          ? products.filter((entry) => entry.categoryName === selected.categoryName && entry.id !== selected.id)
          : []
      );
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="py-20 text-center text-xs font-bold uppercase text-[#A0B1C5]">Loading product...</p>;
  if (!product) return (
    <div className="py-20 text-center space-y-4">
      <h1 className="text-2xl font-black uppercase text-white">Product not found</h1>
      <Link href="/products" className="text-xs font-bold text-[#FFFFFF] border border-[#33506B] px-4 py-2 hover:border-[#FFFFFF] transition-colors">
        Back to All Products
      </Link>
    </div>
  );
  return <ProductDetails product={product} relatedProducts={related} />;
}

// ─── Full Catalogue View (when no slug) ────────────────────────────────────
const FILTERS = [
  { key: 'all', label: 'ALL' },
  { key: 'featured', label: 'FEATURED' },
  { key: 'new', label: 'NEW ARRIVALS' },
  { key: 'bestseller', label: 'BEST SELLERS' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

function CatalogueView() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    listPublishedProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const featured = products.filter((p) => p.isFeatured);
  const newArrivals = products.filter((p) => p.isNewArrival);
  const bestSellers = products.filter((p) => p.isBestSeller);

  const filterBase =
    activeFilter === 'featured' ? (featured.length > 0 ? featured : products) :
    activeFilter === 'new' ? (newArrivals.length > 0 ? newArrivals : products) :
    activeFilter === 'bestseller' ? (bestSellers.length > 0 ? bestSellers : products) :
    products;

  const displayProducts = searchQuery.trim()
    ? filterBase.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filterBase;

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="border-b border-[#33506B] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 bg-[#FFFFFF]" />
            <div>
              <span className="text-[10px] font-mono font-bold text-[#A0B1C5] uppercase tracking-widest block mb-1">
                STORE CATALOGUE
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight leading-none flex items-center gap-2">
                <Package className="w-7 h-7 shrink-0" />
                ALL PRODUCTS
              </h1>
              <p className="text-xs text-[#A0B1C5] mt-1.5">
                {loading ? 'Loading products...' : `${products.length} products available`}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#A0B1C5] hover:text-[#FFFFFF] uppercase tracking-wider transition-colors self-start sm:self-end"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0B1C5]" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#142230] border border-[#33506B] text-[#FFFFFF] text-xs font-mono placeholder:text-[#33506B] pl-9 pr-4 py-2.5 rounded-none focus:outline-none focus:border-[#FFFFFF] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0B1C5] hover:text-[#FFFFFF]"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[#A0B1C5] hidden sm:flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> FILTER:
          </span>
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
            </button>
          ))}
        </div>
      </div>

      {/* Results count when searching */}
      {searchQuery && !loading && (
        <p className="text-[11px] font-mono text-[#A0B1C5]">
          {displayProducts.length} result{displayProducts.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
        </p>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : displayProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bento-card p-16 text-center space-y-4">
          <Package className="w-12 h-12 text-[#33506B] mx-auto" />
          <p className="text-sm font-mono font-bold text-[#A0B1C5] uppercase">No products found</p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] font-mono text-[#FFFFFF] border border-[#33506B] px-4 py-2 hover:border-[#FFFFFF] transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-[11px] font-mono text-[#FFFFFF] border border-[#33506B] px-4 py-2 hover:border-[#FFFFFF] transition-colors"
            >
              Show All Products
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page: routes between catalogue and product detail ─────────────────
function ProductsPageContent() {
  const slug = useSearchParams().get('slug') || '';
  if (slug) return <ProductView slug={slug} />;
  return <CatalogueView />;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-xs font-bold uppercase text-[#A0B1C5]">Loading...</p>}>
      <ProductsPageContent />
    </Suspense>
  );
}
