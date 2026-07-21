'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import ProductCard from '@/components/product/ProductCard';
import { Heart } from 'lucide-react';
import { listPublishedProducts } from '@/lib/client-services';
import type { ProductDto } from '@/lib/catalog-types';

export default function WishlistPage() {
  const { wishlist, clearWishlist } = useStore();
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all products to filter client-side
  useEffect(() => {
    // Standard mock or service fallback API fetch
    const fetchProducts = async () => {
      try {
        setAllProducts(await listPublishedProducts());
      } catch {
        console.warn("Failed fetching products for wishlist client-side.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const wishlistedProducts = allProducts.filter(p => wishlist.includes(p.slug));

  return (
    <div className="space-y-8">
      {/* Breadcrumbs & Title */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-brand-dark-gray/60 uppercase tracking-widest flex items-center gap-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-brand-black">Wishlist</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
            My Wishlist ({wishlistedProducts.length})
          </h1>
          {wishlistedProducts.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline"
            >
              Clear All Wishlist
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-brand-white border border-brand-black/5 aspect-[3/4] animate-pulse clip-angled" />
          ))}
        </div>
      ) : wishlistedProducts.length === 0 ? (
        <div className="bg-brand-white border border-brand-black/5 py-20 px-4 text-center rounded-none clip-angled">
          <Heart className="w-12 h-12 text-brand-dark-gray/30 mx-auto stroke-[1.5] mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Your wishlist is empty</h3>
          <p className="text-xs text-brand-dark-gray mt-1 max-w-sm mx-auto">
            You haven&apos;t saved any tactical equipment to your wishlist yet. Explore products to bookmark your favorites.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block border border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white text-xs font-bold uppercase py-2.5 px-6 transition-colors clip-angled"
          >
            Go Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {wishlistedProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
